// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Address Utility Library
 * @dev A standalone library providing safe address operations and contract interactions.
 * 
 * This library offers:
 * - Contract detection: Distinguish between EOAs (wallets) and smart contracts
 * - Safe ETH transfers: Secure value transfers with proper error handling
 * - Function calls: Execute contract functions with various call types
 * - Error handling: Comprehensive validation and revert management
 * 
 * Call Types:
 * - functionCall: Standard contract function execution
 * - functionCallWithValue: Contract calls that send ETH
 * - functionStaticCall: Read-only calls that don't modify state
 * - functionDelegateCall: Execute code in current contract's context
 */

library Address {
    /**
     * @dev Determines if an address contains a smart contract.
     * @param account The address to check
     * @return bool True if the address is a contract, false if it's an EOA (wallet)
     * 
     * Note: Returns false during contract construction since code isn't deployed yet.
     */
    function isContract(address account) internal view returns (bool) {
        // This method relies on extcodesize/address.code.length, which returns 0
        // for contracts in construction, since the code is only stored at the end
        // of the constructor execution.
        return account.code.length > 0;
    }

    /**
     * @dev Safely sends ETH to a recipient address with full gas forwarding.
     * @param recipient The address to receive ETH
     * @param amount The amount of wei to send
     * 
     * Safer than Solidity's transfer() which has a 2300 gas limit.
     * This function forwards all available gas, preventing failed transfers.
     */
    function sendValue(address payable recipient, uint256 amount) internal {
        require(address(this).balance >= amount, "Address: insufficient balance");

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Address: unable to send value, recipient may have reverted");
    }

    /**
     * @dev Executes a function call on a target contract with safety checks.
     * @param target The contract address to call
     * @param data The encoded function call data
     * @return bytes The return data from the function call
     */
    function functionCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionCall(target, data, "Address: low-level call failed");
    }

    /**
     * @dev Executes a function call with a custom error message.
     * @param target The contract address to call
     * @param data The encoded function call data
     * @param errorMessage Custom error message if the call fails
     * @return bytes The return data from the function call
     */
    function functionCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, errorMessage);
    }

    /**
     * @dev Executes a function call while sending ETH to the target contract.
     * @param target The contract address to call
     * @param data The encoded function call data
     * @param value The amount of wei to send with the call
     * @return bytes The return data from the function call
     */
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value
    ) internal returns (bytes memory) {
        return functionCallWithValue(target, data, value, "Address: low-level call with value failed");
    }

    /**
     * @dev Executes a payable function call with custom error handling.
     * @param target The contract address to call
     * @param data The encoded function call data
     * @param value The amount of wei to send with the call
     * @param errorMessage Custom error message if the call fails
     * @return bytes The return data from the function call
     */
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value,
        string memory errorMessage
    ) internal returns (bytes memory) {
        require(address(this).balance >= value, "Address: insufficient balance for call");
        require(isContract(target), "Address: call to non-contract");

        (bool success, bytes memory returndata) = target.call{value: value}(data);
        return verifyCallResult(success, returndata, errorMessage);
    }

    /**
     * @dev Executes a read-only function call that cannot modify contract state.
     * @param target The contract address to call
     * @param data The encoded function call data
     * @return bytes The return data from the static call
     */
    function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {
        return functionStaticCall(target, data, "Address: low-level static call failed");
    }

    /**
     * @dev Executes a static call with custom error handling.
     * @param target The contract address to call
     * @param data The encoded function call data
     * @param errorMessage Custom error message if the call fails
     * @return bytes The return data from the static call
     */
    function functionStaticCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        require(isContract(target), "Address: static call to non-contract");

        (bool success, bytes memory returndata) = target.staticcall(data);
        return verifyCallResult(success, returndata, errorMessage);
    }

    /**
     * @dev Executes code from target contract in the current contract's context.
     * @param target The contract containing the code to execute
     * @param data The encoded function call data
     * @return bytes The return data from the delegate call
     */
    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionDelegateCall(target, data, "Address: low-level delegate call failed");
    }

    /**
     * @dev Executes a delegate call with custom error handling.
     * @param target The contract containing the code to execute
     * @param data The encoded function call data
     * @param errorMessage Custom error message if the call fails
     * @return bytes The return data from the delegate call
     */
    function functionDelegateCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        require(isContract(target), "Address: delegate call to non-contract");

        (bool success, bytes memory returndata) = target.delegatecall(data);
        return verifyCallResult(success, returndata, errorMessage);
    }

    /**
     * @dev Validates the result of a low-level call and handles failures.
     * @param success Whether the call succeeded
     * @param returndata The data returned from the call
     * @param errorMessage Fallback error message if no revert reason is provided
     * @return bytes The validated return data
     */
    function verifyCallResult(
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) internal pure returns (bytes memory) {
        if (success) {
            return returndata;
        } else {
            // Look for revert reason and bubble it up if present
            if (returndata.length > 0) {
                // The easiest way to bubble the revert reason is using memory via assembly
                /// @solidity memory-safe-assembly
                assembly {
                    let returndata_size := mload(returndata)
                    revert(add(32, returndata), returndata_size)
                }
            } else {
                revert(errorMessage);
            }
        }
    }
}
