/**
 * Embed Reviews Script
 * Generates vector embeddings for existing reviews using Google's text-embedding-004
 * 
 * Usage: node src/scripts/embedReviews.js
 * 
 * Options:
 *   --batch-size=100  Number of reviews to process per batch
 *   --limit=1000      Maximum total reviews to process
 *   --dry-run         Show what would be embedded without making changes
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { 
  embedDocuments, 
  getReviewsWithoutEmbeddings,
  updateReviewEmbedding,
  EMBEDDING_DIMENSION,
} from "../agents/rag/vectorStore.js";

dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace("--", "").split("=");
  acc[key] = value !== undefined ? value : true;
  return acc;
}, {});

const BATCH_SIZE = parseInt(args["batch-size"]) || 50;
const LIMIT = parseInt(args["limit"]) || 10000;
const DRY_RUN = args["dry-run"] || false;

// Rate limiting - Google's free tier has limits
const DELAY_BETWEEN_BATCHES_MS = 2000;

/**
 * Sleep helper
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Connect to MongoDB
 */
async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MongoDB URI not found in environment variables");
  }

  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");
}

/**
 * Process a batch of reviews
 * @param {Array} reviews - Reviews to process
 * @returns {Promise<number>} - Number of reviews processed
 */
async function processBatch(reviews) {
  if (reviews.length === 0) return 0;

  // Build text content for each review
  const texts = reviews.map((r) => {
    // Combine title and content for richer embedding
    return `${r.mediaTitle}: ${r.content}`;
  });

  try {
    // Generate embeddings for all reviews in batch
    const embeddings = await embedDocuments(texts);

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would embed ${reviews.length} reviews`);
      return reviews.length;
    }

    // Update each review with its embedding
    for (let i = 0; i < reviews.length; i++) {
      const review = reviews[i];
      const embedding = embeddings[i];

      if (embedding && embedding.length === EMBEDDING_DIMENSION) {
        await updateReviewEmbedding(review._id, embedding);
      } else {
        console.warn(`  ⚠️  Invalid embedding for review ${review._id}`);
      }
    }

    return reviews.length;
  } catch (error) {
    console.error(`  ❌ Batch error: ${error.message}`);
    
    // If rate limited, wait and return 0 to retry
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      console.log("  ⏳ Rate limited, waiting 60 seconds...");
      await sleep(60000);
      return 0;
    }
    
    throw error;
  }
}

/**
 * Main embedding process
 */
async function main() {
  console.log("\n📚 Review Embedding Script");
  console.log("==========================");
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Max reviews: ${LIMIT}`);
  console.log(`Dry run: ${DRY_RUN}`);
  console.log("");

  // Check for API key
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    console.error("❌ GEMINI_API_KEY or GOOGLE_API_KEY is required");
    process.exit(1);
  }

  try {
    await connectDB();

    // Import Review model after connection
    const Review = mongoose.model("Review");

    // Get total count
    const totalReviews = await Review.countDocuments();
    console.log(`📊 Total reviews in database: ${totalReviews}`);

    let processedCount = 0;
    let batchNumber = 0;

    while (processedCount < LIMIT) {
      batchNumber++;
      
      // Get reviews without embeddings
      const reviews = await getReviewsWithoutEmbeddings(BATCH_SIZE);
      
      if (reviews.length === 0) {
        console.log("\n✅ All reviews have embeddings!");
        break;
      }

      console.log(`\n🔄 Batch ${batchNumber}: Processing ${reviews.length} reviews...`);

      const processed = await processBatch(reviews);
      processedCount += processed;

      console.log(`  ✅ Processed: ${processed} | Total: ${processedCount}`);

      // Rate limiting delay
      if (processed > 0 && processedCount < LIMIT) {
        console.log(`  ⏳ Waiting ${DELAY_BETWEEN_BATCHES_MS}ms before next batch...`);
        await sleep(DELAY_BETWEEN_BATCHES_MS);
      }
    }

    console.log("\n=============================");
    console.log(`✅ Embedding complete!`);
    console.log(`   Total reviews processed: ${processedCount}`);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

// Run the script
main();

