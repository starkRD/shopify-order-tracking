// pages/api/admin-orders.js
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Set CORS headers if needed
  res.setHeader("Access-Control-Allow-Origin", "https://songcart.in");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const shopifyStore = process.env.SHOPIFY_STORE; // e.g. your-store.myshopify.com
  const adminApiAccessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

  // Basic URL: fetch up to 250 orders at a time
  let url = `https://${shopifyStore}/admin/api/2023-01/orders.json?status=any&limit=250`;

  // If you only want unfulfilled:
  // url += `&fulfillment_status=unfulfilled`;

  let allOrders = [];
  try {
    while (url) {
      const response = await fetch(url, {
        headers: {
          "X-Shopify-Access-Token": adminApiAccessToken,
          "Content-Type": "application/json"
        }
      });
      const linkHeader = response.headers.get("Link"); // for pagination
      const data = await response.json();

      if (!data.orders || data.orders.length === 0) {
        // No more orders
        break;
      }
      // Accumulate the orders in our array
      allOrders = allOrders.concat(data.orders);

      // Parse the Link header to find next page, if any
      url = getNextPageUrl(linkHeader);
    }

    // If you need further filtering (like only unfulfilled),
    // you can do it here:
    // allOrders = allOrders.filter(order => !order.fulfillment_status);

    return res.status(200).json({ orders: allOrders });
  } catch (error) {
    console.error("Error fetching orders with pagination:", error);
    return res.status(500).json({ error: "Server error." });
  }
}

/**
 * Extracts the next page URL from Shopify's Link header
 * If there's no 'rel="next"', return null.
 * Example Link header:
 * <https://your-store.myshopify.com/admin/api/2023-01/orders.json?limit=250&page_info=xxx>; rel="next"
 */
function getNextPageUrl(linkHeader) {
  if (!linkHeader) return null;
  // Link header can have multiple parts, but we only want the rel="next"
  // Example: <URL1>; rel="previous", <URL2>; rel="next"
  const links = linkHeader.split(",");
  for (let part of links) {
    const section = part.split(";");
    if (section[1] && section[1].includes('rel="next"')) {
      // section[0] is something like <https://...>
      // remove angle brackets
      return section[0].replace(/<(.*)>/, "$1").trim();
    }
  }
  return null;
}
