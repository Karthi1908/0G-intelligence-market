// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title MockOracle
/// @notice Testnet oracle that always validates proofs.
///         Replace with TEE-based oracle for production.
contract MockOracle {
    address public owner;

    event ProofVerified(bytes32 indexed proofHash, bool result);

    constructor() {
        owner = msg.sender;
    }

    /// @notice Always returns true for testnet — real oracle uses TEE attestation
    function verifyProof(bytes calldata proof) external returns (bool) {
        bytes32 ph = keccak256(proof);
        emit ProofVerified(ph, true);
        return true;
    }

    function getStatus() external pure returns (string memory) {
        return "MockOracle:OK";
    }
}
