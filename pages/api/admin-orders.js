// pages/api/admin-orders.js

export default async function handler(req, res) {
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', 'https://songcart.in');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  
  res.setHeader('Access-Control-Allow-Origin', 'https://songcart.in');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  const shopifyStore = process.env.SHOPIFY_STORE;
  const adminApiAccessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
  
  // Optional: You might accept a "filter" query parameter,
  // e.g., filter=pending or filter=today
  const filter = req.query.filter || "pending";
  
  // Fetch recent orders (adjust API parameters as needed)
  let url = `https://${shopifyStore}/admin/api/2023-01/orders.json?status=any&limit=50`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": adminApiAccessToken,
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();
    
    if (!data.orders || data.orders.length === 0) {
      return res.status(404).json({ error: "No orders found." });
    }
    
    // Filter orders based on fulfillment_status and/or expected delivery date.
    // For demonstration, we'll assume:
    // - "pending" orders are those that are not fulfilled.
    // - "today" orders are those with an expected delivery date of today.
    // (You'll need to compute expected delivery date based on your timeline logic.)
    
    // For simplicity, let's pass through all orders for now.
    // You can later add your logic to filter them.
    
    // Example: return only orders that are unfulfilled if filter === "pending"
    let filteredOrders = data.orders;
    if (filter === "pending") {
      filteredOrders = data.orders.filter(order => 
        order.fulfillment_status === null || order.fulfillment_status.toLowerCase() !== "fulfilled"
      );
    }
    
    // Optionally, add computed fields such as expected_delivery based on order creation & variant IDs.
    // (You can use similar logic as in your customer tracking code.)
    
    // For now, we'll return order id, created_at, fulfillment_status, and order name.
    const ordersList = filteredOrders.map(order => ({
      name: order.name,
      created_at: order.created_at,
      fulfillment_status: order.fulfillment_status,
      // Add additional fields if needed
    }));
    
    return res.status(200).json({ orders: ordersList });
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    return res.status(500).json({ error: "Server error." });
  }
}
