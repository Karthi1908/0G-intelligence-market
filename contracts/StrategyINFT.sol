// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IOracle {
    function verifyProof(bytes calldata proof) external returns (bool);
}

/// @title StrategyINFT
/// @notice ERC-7857 compliant iNFT contract for Deribit trading strategies.
///         Each token represents a tokenized AI/TA trading strategy with
///         encrypted metadata stored on 0G Storage.
contract StrategyINFT is ERC721, Ownable, ReentrancyGuard {

    // ── Strategy Type Enum ──────────────────────────────────────────────────
    enum StrategyType {
        LinearRegression,       // 0
        ARIMA,                  // 1
        LSTM,                   // 2
        RandomForest,           // 3
        XGBoost,                // 4
        MovingAverageCrossover, // 5
        RSI,                    // 6
        BollingerBands,         // 7
        MACDStrategy,           // 8
        MeanReversion           // 9
    }

    // ── State ───────────────────────────────────────────────────────────────
    uint256 private _nextTokenId = 1;

    mapping(uint256 => bytes32)           public metadataHashes;
    mapping(uint256 => string)            public encryptedURIs;
    mapping(uint256 => uint8)             public strategyTypes;
    mapping(uint256 => bool)              public isComposite;
    mapping(uint256 => uint256[])         private _parentTokenIds;
    mapping(uint256 => mapping(address => bytes)) public authorizations;

    address public oracle;
    address public marketplace;
    uint256 public mintPrice = 0.001 ether;

    // ── Events ──────────────────────────────────────────────────────────────
    event StrategyMinted(uint256 indexed tokenId, address indexed to, StrategyType strategyType);
    event StrategyCloned(uint256 indexed originalId, uint256 indexed cloneId, address indexed to);
    event StrategiesMerged(uint256 indexed tokenIdA, uint256 indexed tokenIdB, uint256 indexed newTokenId);
    event MetadataUpdated(uint256 indexed tokenId, bytes32 newHash);
    event UsageAuthorized(uint256 indexed tokenId, address indexed executor);
    event OracleUpdated(address oldOracle, address newOracle);
    event MarketplaceUpdated(address oldMarketplace, address newMarketplace);

    // ── Modifiers ────────────────────────────────────────────────────────────
    modifier validProof(bytes calldata proof) {
        require(oracle != address(0), "Oracle not set");
        require(IOracle(oracle).verifyProof(proof), "Invalid oracle proof");
        _;
    }

    // ── Constructor ──────────────────────────────────────────────────────────
    constructor(address _oracle) ERC721("Deribit Strategy iNFT", "DSINFT") {
        oracle = _oracle;
    }

    // ── Admin ────────────────────────────────────────────────────────────────

    function setOracle(address _oracle) external onlyOwner {
        emit OracleUpdated(oracle, _oracle);
        oracle = _oracle;
    }

    function setMarketplace(address _marketplace) external onlyOwner {
        marketplace = _marketplace;
        emit MarketplaceUpdated(marketplace, _marketplace);
    }

    // ── ERC-7857 Core ────────────────────────────────────────────────────────

    /// @notice Mint a new strategy iNFT (anybody can mint by paying the mintPrice)
    function mint(
        address to,
        StrategyType strategyType,
        string calldata encryptedURI,
        bytes32 metadataHash
    ) external payable returns (uint256) {
        require(msg.value >= mintPrice, "Insufficient payment");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        strategyTypes[tokenId]  = uint8(strategyType);
        encryptedURIs[tokenId]  = encryptedURI;
        metadataHashes[tokenId] = metadataHash;
        isComposite[tokenId]    = false;

        // Refund excess
        if (msg.value > mintPrice) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - mintPrice}("");
            require(refunded, "Refund failed");
        }

        emit StrategyMinted(tokenId, to, strategyType);
        return tokenId;
    }

    /// @notice Purchase a new strategy iNFT directly (mints a new token)
    function purchaseStrategy(StrategyType strategyType) external payable returns (uint256) {
        require(msg.value >= mintPrice, "Insufficient payment");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        strategyTypes[tokenId]  = uint8(strategyType);
        encryptedURIs[tokenId]  = "";
        metadataHashes[tokenId] = bytes32(0);
        isComposite[tokenId]    = false;

        // Funds stay in the contract (Treasury)
        // Owner can withdraw later using the withdraw() function

        // Refund excess
        if (msg.value > mintPrice) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - mintPrice}("");
            require(refunded, "Refund failed");
        }

        emit StrategyMinted(tokenId, msg.sender, strategyType);
        return tokenId;
    }

    /// @notice Withdraw accumulated fees (owner only)
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /// @notice Clone an existing iNFT — creates new token with same metadata
    /// @dev Implements ERC-7857 clone() — caller must own the original token
    function clone(
        address to,
        uint256 tokenId,
        bytes calldata sealedKey,
        bytes calldata proof
    ) external nonReentrant validProof(proof) returns (uint256) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        require(to != address(0), "Invalid recipient");

        uint256 newTokenId = _nextTokenId++;
        _safeMint(to, newTokenId);

        // Copy all metadata from original
        strategyTypes[newTokenId]  = strategyTypes[tokenId];
        encryptedURIs[newTokenId]  = encryptedURIs[tokenId];
        metadataHashes[newTokenId] = metadataHashes[tokenId];
        isComposite[newTokenId]    = isComposite[tokenId];

        // Copy immediate parents only (don't flatten lineage to save gas)
        uint256[] storage parents = _parentTokenIds[tokenId];
        for (uint256 i = 0; i < parents.length; i++) {
            _parentTokenIds[newTokenId].push(parents[i]);
        }

        emit StrategyCloned(tokenId, newTokenId, to);
        return newTokenId;
    }

    /// @notice Merge two strategy iNFTs into a new composite iNFT
    /// @dev Both original tokens remain owned. New composite iNFT is minted.
    ///      The composite runs both strategies in parallel.
    function merge(
        uint256 tokenIdA,
        uint256 tokenIdB,
        string calldata compositeEncryptedURI,
        bytes32 compositeMetadataHash
    ) external nonReentrant returns (uint256) {
        require(ownerOf(tokenIdA) == msg.sender, "Not owner of token A");
        require(ownerOf(tokenIdB) == msg.sender, "Not owner of token B");
        require(tokenIdA != tokenIdB, "Cannot merge token with itself");

        uint256 newTokenId = _nextTokenId++;
        _safeMint(msg.sender, newTokenId);

        // Composite gets a special strategy type (255 = Composite)
        strategyTypes[newTokenId]  = 255;
        encryptedURIs[newTokenId]  = compositeEncryptedURI;
        metadataHashes[newTokenId] = compositeMetadataHash;
        isComposite[newTokenId]    = true;

        // Track immediate parents only
        // Reconstructing lineage can be done off-chain by traversing parents
        _parentTokenIds[newTokenId].push(tokenIdA);
        _parentTokenIds[newTokenId].push(tokenIdB);

        emit StrategiesMerged(tokenIdA, tokenIdB, newTokenId);
        return newTokenId;
    }

    /// @notice ERC-7857 transfer with metadata re-encryption proof
    function secureTransfer(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata sealedKey,
        bytes calldata proof
    ) external nonReentrant validProof(proof) {
        require(ownerOf(tokenId) == from, "Not owner");
        require(to != address(0), "Invalid recipient");
        require(
            msg.sender == from || isApprovedForAll(from, msg.sender) ||
            getApproved(tokenId) == msg.sender,
            "Not authorized"
        );

        // Update metadata access for new owner
        bytes32 newHash = keccak256(sealedKey);
        metadataHashes[tokenId] = newHash;

        _transfer(from, to, tokenId);
        emit MetadataUpdated(tokenId, newHash);
    }

    /// @notice Grant usage rights without ownership transfer (AIaaS model)
    function authorizeUsage(
        uint256 tokenId,
        address executor,
        bytes calldata permissions
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        authorizations[tokenId][executor] = permissions;
        emit UsageAuthorized(tokenId, executor);
    }

    // ── View Functions ───────────────────────────────────────────────────────

    function getParentTokenIds(uint256 tokenId) external view returns (uint256[] memory) {
        return _parentTokenIds[tokenId];
    }

    function getStrategyInfo(uint256 tokenId) external view returns (
        uint8 strategyType,
        bool composite,
        uint256[] memory parents,
        string memory encryptedURI,
        bytes32 metadataHash
    ) {
        require(_exists(tokenId), "Token does not exist");
        return (
            strategyTypes[tokenId],
            isComposite[tokenId],
            _parentTokenIds[tokenId],
            encryptedURIs[tokenId],
            metadataHashes[tokenId]
        );
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return encryptedURIs[tokenId];
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    /// @notice Allow marketplace contract to transfer tokens on behalf of owners
    function isApprovedForAll(address owner, address operator)
        public view override returns (bool)
    {
        if (operator == marketplace && marketplace != address(0)) return true;
        return super.isApprovedForAll(owner, operator);
    }
}
