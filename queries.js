// Task 2
 db.books.insertMany(books)([
 {
    title: 'Cry, the Beloved Country',
    author: 'Alan Paton',
    genre: 'Historical Fiction',
    published_year: 1948,
    price: 180,
    in_stock: true,
    pages: 312,
    publisher: 'Scribner'
  },
  {
    title: 'Things Fall Apart',
    author: 'Chinua Achebe',
    genre: 'Tragedy',
    published_year: 1958,
    price: 150,
    in_stock: true,
    pages: 209,
    publisher: 'Heinemann'
  },
  {
    title: 'Life of Pi',
    author: 'Yann Martel',
    genre: 'Adventure',
    published_year: 2001,
    price: 190,
    in_stock: false,
    pages: 319,
    publisher: 'Canongate Books'
  },
  {
    title: 'Macbeth',
    author: 'William Shakespeare',
    genre: 'Drama',
    published_year: 1606,
    price: 130,
    in_stock: true,
    pages: 240,
    publisher: 'Oxford University Press'
  },
  {
    title: 'Nothing but the Truth',
    author: 'John Kani',
    genre: 'Drama',
    published_year: 2002,
    price: 140,
    in_stock: true,
    pages: 96,
    publisher: 'Wits University Press'
  },
  {
    title: 'Lord of the Flies',
    author: 'William Golding',
    genre: 'Allegorical Novel',
    published_year: 1954,
    price: 160,
    in_stock: true,
    pages: 224,
    publisher: 'Faber & Faber'
  },
  {
    title: 'Tsotsi',
    author: 'Athol Fugard',
    genre: 'Drama',
    published_year: 1980,
    price: 170,
    in_stock: true,
    pages: 240,
    publisher: 'Oxford University Press'
  },
  {
    title: 'A Grain of Wheat',
    author: "Ngũgĩ wa Thiong'o",
    genre: 'Historical Fiction',
    published_year: 1967,
    price: 175,
    in_stock: false,
    pages: 245,
    publisher: 'Heinemann'
  },
  {
    title: 'The Boy Who Harnessed the Wind',
    author: 'William Kamkwamba',
    genre: 'Memoir',
    published_year: 2009,
    price: 200,
    in_stock: true,
    pages: 320,
    publisher: 'HarperCollins'
  },
  {
    title: 'So Long a Letter',
    author: 'Mariama Bâ',
    genre: 'Fiction',
    published_year: 1981,
    price: 155,
    in_stock: true,
    pages: 96,
    publisher: 'Heinemann'
  }
]);

// Task 3
//use plp_bookstore

// 1. Books in stock AND published after 2010
db.books.find({ in_stock: true, published_year: { $gt: 2010 } })

// 2. Projection - return only title, author, price (no _id)
db.books.find({}, { title: 1, author: 1, price: 1, _id: 0 })

// 3. Sort by price ascending (cheapest first)
db.books.find().sort({ price: 1 })

// 4. Sort by price descending (most expensive first)  
db.books.find().sort({ price: -1 })

// 5. Pagination - Page 1 (first 5 books)
db.books.find().limit(5).skip(0)

// 6. Pagination - Page 2 (next 5 books)
db.books.find().limit(5).skip(5)

//Task 4
//Aggregation pipeline

// 1. Average price by genre
db.books.aggregate([
  {
    $group: {
      _id: "$genre",
      averagePrice: { $avg: "$price" },
      count: { $sum: 1 }
    }
  },
  {
    $sort: { averagePrice: -1 }
  }
])

// 2. Author with most books
db.books.aggregate([
  {
    $group: {
      _id: "$author",
      bookCount: { $sum: 1 },
      books: { $push: "$title" }
    }
  },
  {
    $sort: { bookCount: -1 }
  },
  {
    $limit: 1
  }
])

// 3. Books grouped by publication decade
db.books.aggregate([
  {
    $addFields: {
      decade: {
        $subtract: [
          "$published_year",
          { $mod: ["$published_year", 10] }
        ]
      }
    }
  },
  {
    $group: {
      _id: "$decade",
      count: { $sum: 1 },
      books: { $push: { title: "$title", year: "$published_year" } }
    }
  },
  {
    $sort: { _id: 1 }
  }
])

//Task 5
//Indexing

const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('plp_bookstore');
    const books = db.collection('books');

    // 1. Create single field index on title
    const index1 = await books.createIndex({ title: 1 });
    console.log("Single field index created on title:", index1);

    // 2. Create compound index on author and published_year
    const index2 = await books.createIndex({ author: 1, published_year: -1 });
    console.log("Compound index created on author + published_year:", index2);

    // 3. List all indexes to verify
    const indexes = await books.indexes();
    console.log("All indexes on books collection:");
    console.table(indexes);

    // 4. Performance analysis with explain()

    // Test query WITHOUT index (force collection scan)
    const explainNoIndex = await books
      .find({ title: "The Great Gatsby" })
      .hint({ $natural: 1 }) // Forces a full collection scan
      .explain("executionStats");
    console.log("WITHOUT index - executionStats:");
    console.log("Time:", explainNoIndex.executionStats.executionTimeMillis);
    console.log("Docs Examined:", explainNoIndex.executionStats.totalDocsExamined);

    // Test same query WITH index
    const explainWithIndex = await books
      .find({ title: "The Great Gatsby" })
      .explain("executionStats");
    console.log("WITH index - executionStats:");
    console.log("Time:", explainWithIndex.executionStats.executionTimeMillis);
    console.log("Docs Examined:", explainWithIndex.executionStats.totalDocsExamined);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

run();
