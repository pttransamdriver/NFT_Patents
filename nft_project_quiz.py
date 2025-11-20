#!/usr/bin/env python3
"""
NFT Patent Marketplace Quiz
Tests knowledge of file locations and execution flows
"""

import random
import sys

class NFTProjectQuiz:
    def __init__(self):
        self.questions = [
            {
                "question": "When a user searches for patents, which file handles the initial user input?",
                "options": ["src/services/patentApi.ts", "src/pages/PatentSearchPage.tsx"],
                "correct": 1,
                "explanation": "PatentSearchPage.tsx:33 (handleSearch) handles the user clicking the search button"
            },
            {
                "question": "Which backend route processes patent search requests?",
                "options": ["backend/routes/patents.js", "backend/routes/ipfs.js"],
                "correct": 0,
                "explanation": "backend/routes/patents.js:62 (GET /api/patents/search) receives and processes search requests"
            },
            {
                "question": "When minting an NFT, which service orchestrates the entire minting process?",
                "options": ["src/services/patentPdfService.ts", "src/services/mintingService.ts"],
                "correct": 1,
                "explanation": "mintingService.ts:48 (mintPatentNFT) orchestrates the complete minting workflow"
            },
            {
                "question": "Which smart contract function actually mints the NFT on the blockchain?",
                "options": ["contracts/PatentNFT.sol:52 (mintPatentNFT)", "contracts/NFTMarketplace.sol (getAllActiveListings)"],
                "correct": 0,
                "explanation": "PatentNFT.sol:52 (mintPatentNFT) handles the actual NFT minting on blockchain"
            },
            {
                "question": "Where is the PDF processing for patents handled?",
                "options": ["backend/routes/pdf.js", "src/utils/web3Utils.ts"],
                "correct": 0,
                "explanation": "backend/routes/pdf.js:8 (POST /api/pdf/process-patent) generates placeholder PDFs"
            },
            {
                "question": "Which file handles IPFS metadata uploads via Pinata?",
                "options": ["src/services/patentApi.ts", "backend/routes/ipfs.js"],
                "correct": 1,
                "explanation": "backend/routes/ipfs.js:67 (POST /api/pinata/upload-json) uploads metadata to IPFS"
            },
            {
                "question": "When viewing marketplace listings, which service fetches the listings?",
                "options": ["src/services/marketplaceService.ts", "src/services/mintingService.ts"],
                "correct": 0,
                "explanation": "marketplaceService.ts:75 (getMarketplaceListings) fetches marketplace listings"
            },
            {
                "question": "Which file contains the wallet connection and network verification logic?",
                "options": ["src/utils/contracts.ts", "src/utils/web3Utils.ts"],
                "correct": 1,
                "explanation": "web3Utils.ts handles MetaMask connection verification and network switching"
            },
            {
                "question": "Where are the smart contract instances created?",
                "options": ["src/utils/contracts.ts", "src/services/patentApi.ts"],
                "correct": 0,
                "explanation": "contracts.ts (getPatentNFTContract) creates contract instances with signers"
            },
            {
                "question": "Which smart contract checks if a patent already exists before minting?",
                "options": ["contracts/NFTMarketplace.sol", "contracts/PatentNFT.sol"],
                "correct": 1,
                "explanation": "PatentNFT.sol:97 (patentExists) checks if each patent is already minted"
            },
            {
                "question": "What is the minimum minting fee required by the smart contract?",
                "options": ["0.025 ETH", "0.05 ETH"],
                "correct": 1,
                "explanation": "PatentNFT.sol:53 verifies payment >= 0.05 ETH for minting"
            },
            {
                "question": "Which page component handles the marketplace UI?",
                "options": ["src/pages/MarketplacePage.tsx", "src/pages/PatentSearchPage.tsx"],
                "correct": 0,
                "explanation": "MarketplacePage.tsx:47 loads and displays marketplace listings"
            },
            {
                "question": "Where is the routing configuration that maps /marketplace to the marketplace page?",
                "options": ["src/App.tsx", "src/main.tsx"],
                "correct": 0,
                "explanation": "App.tsx:27 contains the route /marketplace → <MarketplacePage />"
            },
            {
                "question": "Which external API is used to fetch patent data?",
                "options": ["Google Patents via SerpAPI", "USPTO Direct API"],
                "correct": 0,
                "explanation": "backend/routes/patents.js:80 calls SerpAPI to access Google Patents data"
            },
            {
                "question": "What percentage marketplace fee is collected on sales?",
                "options": ["2.5%", "5%"],
                "correct": 0,
                "explanation": "The architecture shows 2.5% platform fee in the NFTMarketplace contract"
            }
        ]

    def run_quiz(self):
        print("🧠 NFT Patent Marketplace Quiz")
        print("=" * 50)
        print("Test your knowledge of where features and functionality are located!")
        print("Choose option 1 or 2 for each question.\n")
        
        # Select a random question
        question_data = random.choice(self.questions)
        
        print(f"Question: {question_data['question']}\n")
        
        for i, option in enumerate(question_data['options'], 1):
            print(f"{i}. {option}")
        
        print()
        
        # Get user input
        while True:
            try:
                answer = input("Your answer (1 or 2): ").strip()
                if answer in ['1', '2']:
                    user_choice = int(answer) - 1
                    break
                else:
                    print("Please enter 1 or 2")
            except (ValueError, KeyboardInterrupt):
                print("\nQuiz cancelled.")
                sys.exit(0)
        
        print()
        
        # Check answer
        if user_choice == question_data['correct']:
            print("✅ CORRECT!")
        else:
            print("❌ INCORRECT!")
            correct_answer = question_data['options'][question_data['correct']]
            print(f"The correct answer is: {correct_answer}")
        
        print(f"\n💡 Explanation: {question_data['explanation']}")
        print("\nQuiz complete! Run again for a different question.")

if __name__ == "__main__":
    quiz = NFTProjectQuiz()
    quiz.run_quiz()