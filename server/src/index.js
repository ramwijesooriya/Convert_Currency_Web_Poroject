const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();

// Check if APP_ID is available
if (!process.env.APP_ID) {
  console.error("APP_ID is missing from the environment variables.");
  process.exit(1);
}

// Middleware
app.use(express.json());
app.use(cors());

// Convert Route
app.get("/convert", async (req, res) => {
  const { date, sourceCurrency, targetCurrency, amountInSourceCurrency } = req.query;

  if (!date || !sourceCurrency || !targetCurrency || !amountInSourceCurrency) {
    return res.status(400).json({ error: "Missing required query parameters." });
  }

  const currencyURL = `https://openexchangerates.org/api/historical/${date}.json?app_id=${process.env.APP_ID}`;
  const namesURL = `https://openexchangerates.org/api/currencies.json`;

  try {
    // Fetch exchange rates
    const response = await axios.get(currencyURL);
    const data = response.data;

    if (response.status !== 200 || !data || !data.rates) {
      throw new Error("Failed to fetch exchange rates.");
    }

    const rates = data.rates;

    if (!rates[sourceCurrency] || !rates[targetCurrency]) {
      return res.status(400).json({
        error: "The specified source or target currency is not available.",
      });
    }

    // Fetch currency names
    const namesResponse = await axios.get(namesURL);
    const namesData = namesResponse.data;

    const sourceCurrencyName = namesData[sourceCurrency] || sourceCurrency;
    const targetCurrencyName = namesData[targetCurrency] || targetCurrency;

    // Perform conversion
    const sourceRate = rates[sourceCurrency];
    const targetRate = rates[targetCurrency];
    const targetValue = (targetRate / sourceRate) * amountInSourceCurrency;

    return res.status(200).json({
      amountInTargetCurrency: targetValue,
      sourceCurrencyName,
      targetCurrencyName,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get All Currencies Route
app.get("/getAllCurrencies", async (req, res) => {
  const namesURL = `https://openexchangerates.org/api/currencies.json?app_id=${process.env.APP_ID}`;

  try {
    const namesResponse = await axios.get(namesURL);
    const namesData = namesResponse.data;

    return res.status(200).json(namesData);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch currency names." });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
