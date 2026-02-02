// Elements
const scannerContainer = document.getElementById("scanner-container");
const video = document.getElementById("scanner");
const scannerStatus = document.getElementById("scanner-status");
const form = document.getElementById("product-form");
const asinInput = document.getElementById("asin");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const priceInput = document.getElementById("price");
const salePriceInput = document.getElementById("sale-price");
const addProductButton = document.getElementById("add-product");
const downloadCSVButton = document.getElementById("download-csv");

let csvData = [
  ["Name", "Description", "Regular Price", "Sale Price", "Type", "Visibility", "Featured"]
];

// Initialize ZXing Barcode Scanner
const codeReader = new ZXing.BrowserBarcodeReader();
codeReader.decodeFromVideoDevice(null, video, (result, err) => {
  if (result) {
    const asin = result.text.trim();
    scannerStatus.textContent = `Scanned ASIN: ${asin}`;
    if (isValidASIN(asin)) {
      asinInput.value = asin;
      fetchAmazonProduct(asin);
    } else {
      scannerStatus.textContent = "Invalid ASIN format!";
    }
  }
});

// Validate ASIN Format
function isValidASIN(asin) {
  const regex = /^[BX][A-Z0-9]{9}$/; // 10-characters, alphanumeric, starting with 'B' or 'X'
  return regex.test(asin);
}

// Fetch Product Details from Amazon
async function fetchAmazonProduct(asin) {
  const amazonUrl = `https://www.amazon.com/dp/${asin}`;
  try {
    const response = await fetch(amazonUrl);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    // Extract Product Info
    const title = doc.querySelector("#productTitle")?.innerText.trim() || "Unknown Title";
    const description =
      doc.querySelector("#feature-bullets")?.innerText.trim() || "No Description Available";
    const price =
      parseFloat(doc.querySelector(".priceBlockBuyingPriceString")?.innerText.replace("$", "")) ||
      null;

    // Populate Form Fields
    titleInput.value = title;
    descriptionInput.value = description;
    if (price) {
      priceInput.value = price.toFixed(2);
      salePriceInput.value = (price / 2).toFixed(2); // 50% of price
    } else {
      priceInput.placeholder = "Enter price manually";
      scannerStatus.textContent += " (Price unavailable)";
    }
  } catch (e) {
    scannerStatus.textContent = "Error fetching product data!";
  }
}

// Add Product to CSV
addProductButton.addEventListener("click", () => {
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const price = parseFloat(priceInput.value).toFixed(2);
  const salePrice = (price / 2).toFixed(2);

  const featured = parseFloat(salePrice) > 40 ? "yes" : "no";

  csvData.push([title, description, price, salePrice, "auction", "yes", featured]);
  downloadCSVButton.disabled = false;
});

// Download CSV
downloadCSVButton.addEventListener("click", () => {
  const csvContent = `data:text/csv;charset=utf-8,${csvData
    .map(e => e.join(","))
    .join("\n")}`;
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", "woocommerce.csv");
  document.body.appendChild(link);
  link.click();
});