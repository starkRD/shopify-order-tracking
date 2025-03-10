export default async function handler(req, res) {
    // Only allow GET
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    const { query } = req;
    const orderQuery = query.query;
  
    if (!orderQuery) {
      return res.status(400).json({ error: "Missing query parameter." });
    }
  
    // Simple check: does the query contain "@"
    const isEmail = orderQuery.includes("@");
  
    // These come from environment variables in Vercel
    const shopifyStore = process.env.SHOPIFY_STORE; // e.g. "my-store.myshopify.com"
    const adminApiAccessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN; // We'll add this in Vercel
  
    // Build the Shopify Admin API URL
    let url = `https://${shopifyStore}/admin/api/2023-01/orders.json?status=any`;
    if (isEmail) {
      url += `&email=${encodeURIComponent(orderQuery)}`;
    } else {
      url += `&name=${encodeURIComponent(orderQuery)}`;
    }
  
    try {
      // Use the X-Shopify-Access-Token header
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
  
      // Take the first matching order
      const order = data.orders[0];
  
      // Return the details you need on the front end
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
  