// pages/api/order-tracking.js

export default async function handler(req, res) {
  // 1. Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', 'https://songcart.in');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end(); // End the OPTIONS request here
  }

  // 2. Only allow GET requests (and the OPTIONS above)
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 3. Set CORS headers for actual GET requests
  res.setHeader('Access-Control-Allow-Origin', 'https://songcart.in');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { query } = req;
  const orderQuery = query.query;

  if (!orderQuery) {
    return res.status(400).json({ error: "Missing query parameter." });
  }

  const isEmail = orderQuery.includes("@");
  const shopifyStore = process.env.SHOPIFY_STORE;
  const adminApiAccessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

  let url = `https://${shopifyStore}/admin/api/2023-01/orders.json?status=any`;
  if (isEmail) {
    url += `&email=${encodeURIComponent(orderQuery)}`;
  } else {
    url += `&name=${encodeURIComponent(orderQuery)}`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": adminApiAccessToken,
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();

    if (!data.orders || data.orders.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    const order = data.orders[0];

    return res.status(200).json({
      order: {
        created_at: order.created_at,
        tags: order.tags,
        name: order.name,
        fulfillment_status: order.fulfillment_status,  // Added fulfillment status
        line_items: order.line_items.map(item => ({
          variant_id: item.variant_id
        }))
      }
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    return res.status(500).json({ error: "Server error." });
  }
}
