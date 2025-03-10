// api/order-tracking.js

export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    const { query } = req;
    const orderQuery = query.query;
  
    if (!orderQuery) {
      return res.status(400).json({ error: "Missing query parameter." });
    }
  
    // Check if query is an email (simple check)
    const isEmail = orderQuery.includes("@");
  
    // Shopify credentials come from environment variables in Vercel
    const shopifyStore = process.env.SHOPIFY_STORE; // e.g., "your-store.myshopify.com"
    const shopifyApiKey = process.env.SHOPIFY_API_KEY;
    const shopifyPassword = process.env.SHOPIFY_PASSWORD;
  
    // Build Shopify Admin API URL
    let url = `https://${shopifyApiKey}:${shopifyPassword}@${shopifyStore}/admin/api/2023-01/orders.json?status=any`;
    if (isEmail) {
      url += `&email=${encodeURIComponent(orderQuery)}`;
    } else {
      // "name" usually stores the order number (e.g., #1001)
      url += `&name=${encodeURIComponent(orderQuery)}`;
    }
  
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      if (!data.orders || data.orders.length === 0) {
        return res.status(404).json({ error: "Order not found." });
      }
  
      // Take the first (most recent) matching order
      const order = data.orders[0];
  
      return res.status(200).json({
        order: {
          created_at: order.created_at,
          tags: order.tags,
          name: order.name
        }
      });
    } catch (error) {
      console.error("Error fetching order details:", error);
      return res.status(500).json({ error: "Server error." });
    }
  }
  