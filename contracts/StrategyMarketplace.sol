// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IStrategyINFT is IERC721 {
    function secureTransfer(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata sealedKey,
        bytes calldata proof
    ) external;
}

/// @title StrategyMarketplace
/// @notice On-chain marketplace for listing and purchasing strategy iNFTs
contract StrategyMarketplace is ReentrancyGuard, Ownable {

    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;      // in wei (0G native token)
        bool    active;
        uint256 listedAt;
    }

    IStrategyINFT public inftContract;
    uint256 public platformFeePercent = 250; // 2.5% in basis points
    address public feeRecipient;

    mapping(uint256 => Listing) public listings;
    uint256[] private _activeListingIds;
    mapping(uint256 => uint256) private _listingIndex; // tokenId => index in _activeListingIds

    // ── Events ───────────────────────────────────────────────────────────────
    event Listed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event Delisted(uint256 indexed tokenId, address indexed seller);
    event Sold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event FeeUpdated(uint256 newFeePercent);

    constructor(address _inftContract) {
        inftContract = IStrategyINFT(_inftContract);
        feeRecipient = msg.sender;
    }

    // ── Seller Actions ────────────────────────────────────────────────────────

    function listStrategy(uint256 tokenId, uint256 price) external {
        require(inftContract.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(price > 0, "Price must be > 0");
        require(!listings[tokenId].active, "Already listed");

        listings[tokenId] = Listing({
            tokenId:  tokenId,
            seller:   msg.sender,
            price:    price,
            active:   true,
            listedAt: block.timestamp
        });

        _listingIndex[tokenId] = _activeListingIds.length;
        _activeListingIds.push(tokenId);

        emit Listed(tokenId, msg.sender, price);
    }

    function delistStrategy(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(listing.seller == msg.sender || msg.sender == owner(), "Not seller");

        listing.active = false;
        _removeFromActive(tokenId);

        emit Delisted(tokenId, listing.seller);
    }

    // ── Buyer Actions ─────────────────────────────────────────────────────────

    function buyStrategy(
        uint256 tokenId,
        bytes calldata sealedKey,
        bytes calldata proof
    ) external payable nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(msg.value >= listing.price, "Insufficient payment");

        address seller = listing.seller;
        uint256 price  = listing.price;

        // Mark inactive before external calls (reentrancy guard)
        listing.active = false;
        _removeFromActive(tokenId);

        // Calculate platform fee
        uint256 fee = (price * platformFeePercent) / 10000;
        uint256 sellerProceeds = price - fee;

        // Execute secure transfer (ERC-7857)
        inftContract.secureTransfer(seller, msg.sender, tokenId, sealedKey, proof);

        // Pay seller
        (bool sellerPaid, ) = payable(seller).call{value: sellerProceeds}("");
        require(sellerPaid, "Seller payment failed");

        // Pay platform fee
        if (fee > 0) {
            (bool feePaid, ) = payable(feeRecipient).call{value: fee}("");
            require(feePaid, "Fee payment failed");
        }

        // Refund excess
        if (msg.value > price) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - price}("");
            require(refunded, "Refund failed");
        }

        emit Sold(tokenId, seller, msg.sender, price);
    }

    // ── View Functions ────────────────────────────────────────────────────────

    function getActiveListings() external view returns (Listing[] memory) {
        Listing[] memory result = new Listing[](_activeListingIds.length);
        for (uint256 i = 0; i < _activeListingIds.length; i++) {
            result[i] = listings[_activeListingIds[i]];
        }
        return result;
    }

    function getActiveListing(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }

    function activeListingCount() external view returns (uint256) {
        return _activeListingIds.length;
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    function setPlatformFee(uint256 feePercent) external onlyOwner {
        require(feePercent <= 1000, "Fee too high (max 10%)");
        platformFeePercent = feePercent;
        emit FeeUpdated(feePercent);
    }

    function setFeeRecipient(address _recipient) external onlyOwner {
        feeRecipient = _recipient;
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    function _removeFromActive(uint256 tokenId) internal {
        uint256 indexToRemove = _listingIndex[tokenId];
        uint256 lastTokenId   = _activeListingIds[_activeListingIds.length - 1];

        _activeListingIds[indexToRemove] = lastTokenId;
        _listingIndex[lastTokenId]       = indexToRemove;

        _activeListingIds.pop();
        delete _listingIndex[tokenId];
    }
}
