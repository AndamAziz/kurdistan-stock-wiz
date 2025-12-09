import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

// Send message to Telegram
async function sendTelegramMessage(chatId: number | string, text: string, parseMode = "HTML") {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: parseMode,
    }),
  });
  
  return response.json();
}

// Get items expiring soon
async function getExpiringItems(days: number = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  const { data, error } = await supabase
    .from("items")
    .select("*, categories(name), brands(name)")
    .lte("exp_date", futureDate.toISOString().split("T")[0])
    .gte("exp_date", new Date().toISOString().split("T")[0])
    .order("exp_date", { ascending: true })
    .limit(20);
  
  if (error) {
    console.error("Error fetching expiring items:", error);
    return [];
  }
  
  return data || [];
}

// Get expired items
async function getExpiredItems() {
  const today = new Date().toISOString().split("T")[0];
  
  const { data, error } = await supabase
    .from("items")
    .select("*, categories(name), brands(name)")
    .lt("exp_date", today)
    .gt("current_quantity", 0)
    .order("exp_date", { ascending: false })
    .limit(20);
  
  if (error) {
    console.error("Error fetching expired items:", error);
    return [];
  }
  
  return data || [];
}

// Get low stock items - Fixed query using raw SQL comparison
async function getLowStockItems() {
  const { data, error } = await supabase
    .from("items")
    .select("*, categories(name), brands(name)")
    .gt("current_quantity", 0)
    .order("current_quantity", { ascending: true });
  
  if (error) {
    console.error("Error fetching low stock items:", error);
    return [];
  }
  
  // Filter in JavaScript where current_quantity <= min_stock
  const lowStockItems = (data || []).filter(item => item.current_quantity <= item.min_stock);
  return lowStockItems.slice(0, 20);
}

// Search items by name or barcode
async function searchItems(query: string) {
  const { data, error } = await supabase
    .from("items")
    .select("*, categories(name), brands(name)")
    .or(`name.ilike.%${query}%,barcode.ilike.%${query}%`)
    .limit(10);
  
  if (error) {
    console.error("Error searching items:", error);
    return [];
  }
  
  return data || [];
}

// Get all items for report
async function getAllItems() {
  const { data, error } = await supabase
    .from("items")
    .select("*, categories(name), brands(name)")
    .order("name", { ascending: true });
  
  if (error) {
    console.error("Error fetching all items:", error);
    return [];
  }
  
  return data || [];
}

// Get dashboard stats
async function getDashboardStats() {
  const today = new Date().toISOString().split("T")[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  
  // Total items count
  const { count: totalItems } = await supabase
    .from("items")
    .select("*", { count: "exact", head: true });
  
  // Get all items for low stock calculation
  const { data: allItems } = await supabase
    .from("items")
    .select("current_quantity, min_stock")
    .gt("current_quantity", 0);
  
  const lowStockCount = (allItems || []).filter(item => item.current_quantity <= item.min_stock).length;
  
  // Expired count
  const { count: expiredCount } = await supabase
    .from("items")
    .select("*", { count: "exact", head: true })
    .lt("exp_date", today)
    .gt("current_quantity", 0);
  
  // Expiring soon count
  const { count: expiringSoonCount } = await supabase
    .from("items")
    .select("*", { count: "exact", head: true })
    .lte("exp_date", futureDate.toISOString().split("T")[0])
    .gte("exp_date", today);
  
  // Calculate total stock value
  const { data: itemsForValue } = await supabase
    .from("items")
    .select("current_quantity, box_price, piece_price, price_per_kg");
  
  let totalStockValue = 0;
  (itemsForValue || []).forEach(item => {
    const avgPrice = Math.max(item.box_price || 0, item.piece_price || 0, item.price_per_kg || 0);
    totalStockValue += item.current_quantity * avgPrice;
  });
  
  return {
    totalItems: totalItems || 0,
    lowStockCount: lowStockCount,
    expiredCount: expiredCount || 0,
    expiringSoonCount: expiringSoonCount || 0,
    totalStockValue: totalStockValue,
  };
}

// Format item for Telegram message
function formatItem(item: any): string {
  const brand = item.brands?.name || "نەزانراو";
  const category = item.categories?.name || "نەزانراو";
  const expDate = item.exp_date ? new Date(item.exp_date).toLocaleDateString("ku") : "نەزانراو";
  
  return `📦 <b>${item.name}</b>
├ بارکۆد: <code>${item.barcode}</code>
├ براند: ${brand}
├ جۆر: ${category}
├ بڕ: ${item.current_quantity} ${item.unit}
└ بەسەرچوون: ${expDate}`;
}

// Format number with commas
function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

// Generate full report
async function generateFullReport(): Promise<string> {
  const stats = await getDashboardStats();
  const expiredItems = await getExpiredItems();
  const expiringItems = await getExpiringItems();
  const lowStockItems = await getLowStockItems();
  
  const now = new Date();
  const dateStr = now.toLocaleDateString("ku", { 
    year: "numeric", 
    month: "long", 
    day: "numeric",
    weekday: "long"
  });
  
  let report = `📊 <b>ڕاپۆرتی تەواوی کۆگا</b>
📅 ${dateStr}

━━━━━━━━━━━━━━━━━━━━

<b>📈 ئامارەکانی گشتی:</b>
┌ 📦 کۆی کاڵاکان: <b>${formatNumber(stats.totalItems)}</b>
├ 💰 نرخی ستۆک: <b>${formatNumber(stats.totalStockValue)}</b> د.ع
├ ⚠️ کاڵای کەمبوو: <b>${stats.lowStockCount}</b>
├ ❌ کاڵای بەسەرچوو: <b>${stats.expiredCount}</b>
└ ⏰ نزیک لە بەسەرچوون: <b>${stats.expiringSoonCount}</b>

━━━━━━━━━━━━━━━━━━━━`;

  if (expiredItems.length > 0) {
    report += `\n\n❌ <b>کاڵا بەسەرچووەکان (${expiredItems.length}):</b>\n`;
    expiredItems.slice(0, 5).forEach(item => {
      const expDate = item.exp_date ? new Date(item.exp_date).toLocaleDateString("ku") : "";
      report += `\n• ${item.name} - ${item.current_quantity} ${item.unit} (${expDate})`;
    });
    if (expiredItems.length > 5) {
      report += `\n<i>... و ${expiredItems.length - 5} کاڵای تر</i>`;
    }
  }

  if (expiringItems.length > 0) {
    report += `\n\n⏰ <b>نزیک لە بەسەرچوون (${expiringItems.length}):</b>\n`;
    expiringItems.slice(0, 5).forEach(item => {
      const expDate = item.exp_date ? new Date(item.exp_date).toLocaleDateString("ku") : "";
      report += `\n• ${item.name} - ${item.current_quantity} ${item.unit} (${expDate})`;
    });
    if (expiringItems.length > 5) {
      report += `\n<i>... و ${expiringItems.length - 5} کاڵای تر</i>`;
    }
  }

  if (lowStockItems.length > 0) {
    report += `\n\n⚠️ <b>کاڵاکانی کەمبوو (${lowStockItems.length}):</b>\n`;
    lowStockItems.slice(0, 5).forEach(item => {
      report += `\n• ${item.name} - ${item.current_quantity}/${item.min_stock} ${item.unit}`;
    });
    if (lowStockItems.length > 5) {
      report += `\n<i>... و ${lowStockItems.length - 5} کاڵای تر</i>`;
    }
  }

  report += `\n\n━━━━━━━━━━━━━━━━━━━━
🤖 باکوری خۆشەویست`;

  return report;
}

// Generate daily notification message
async function generateDailyNotification(): Promise<string | null> {
  const stats = await getDashboardStats();
  
  // Only send notification if there are issues
  if (stats.expiredCount === 0 && stats.lowStockCount === 0 && stats.expiringSoonCount === 0) {
    return null;
  }
  
  const now = new Date();
  const dateStr = now.toLocaleDateString("ku", { 
    year: "numeric", 
    month: "long", 
    day: "numeric"
  });
  
  let notification = `🔔 <b>ئاگادارکردنەوەی ڕۆژانە</b>
📅 ${dateStr}\n`;

  if (stats.expiredCount > 0) {
    notification += `\n❌ <b>${stats.expiredCount}</b> کاڵا بەسەرچووە!`;
  }

  if (stats.expiringSoonCount > 0) {
    notification += `\n⏰ <b>${stats.expiringSoonCount}</b> کاڵا نزیک لە بەسەرچوونە`;
  }

  if (stats.lowStockCount > 0) {
    notification += `\n⚠️ <b>${stats.lowStockCount}</b> کاڵا کەمبووە`;
  }

  notification += `\n\n📊 بۆ ڕاپۆرتی تەواو: /report`;

  return notification;
}

// Handle incoming Telegram updates
async function handleUpdate(update: any) {
  const message = update.message;
  if (!message || !message.text) return;
  
  const chatId = message.chat.id;
  const text = message.text.trim();
  const command = text.split(" ")[0].toLowerCase();
  const args = text.substring(command.length).trim();
  
  console.log(`Received command: ${command} from chat: ${chatId}`);
  
  try {
    switch (command) {
      case "/start":
        // Save chat ID for notifications
        await saveChatId(chatId);
        
        await sendTelegramMessage(chatId, `👋 <b>بەخێربێیت بۆ بۆتی باکوری خۆشەویست!</b>

ئەم بۆتە یارمەتیت دەدات بۆ بەڕێوەبردنی کۆگاکەت.

<b>فەرمانەکان:</b>
/stats - ئامارەکانی کۆگا
/report - ڕاپۆرتی تەواو
/expiring - کاڵا نزیک لە بەسەرچوون
/expired - کاڵا بەسەرچووەکان
/lowstock - کاڵا کەمبووەکان
/search [ناو/بارکۆد] - گەڕان بۆ کاڵا
/subscribe - چالاککردنی ئاگادارکردنەوەی ڕۆژانە
/unsubscribe - ناچالاککردنی ئاگادارکردنەوە
/help - یارمەتی

🔔 ئاگادارکردنەوەی ڕۆژانە چالاک کرا!`);
        break;
        
      case "/help":
        await sendTelegramMessage(chatId, `📚 <b>لیستی فەرمانەکان:</b>

<b>ئامار و ڕاپۆرت:</b>
/stats - ئامارەکانی گشتی کۆگا
/report - ڕاپۆرتی تەواو (ئامار + کاڵاکانی گرنگ)

<b>کاڵاکان:</b>
/expiring - کاڵاکانی نزیک لە بەسەرچوون (٣٠ ڕۆژ)
/expired - کاڵا بەسەرچووەکان
/lowstock - کاڵاکانی کەمبوون
/search [ناو یان بارکۆد] - گەڕان بۆ کاڵا

<b>ئاگادارکردنەوە:</b>
/subscribe - چالاککردنی ئاگادارکردنەوەی ڕۆژانە
/unsubscribe - ناچالاککردنی ئاگادارکردنەوە

<b>نموونە:</b>
<code>/search پێپسی</code>
<code>/search 123456789</code>`);
        break;
        
      case "/stats":
        const stats = await getDashboardStats();
        await sendTelegramMessage(chatId, `📊 <b>ئامارەکانی کۆگا:</b>

📦 کۆی کاڵاکان: <b>${formatNumber(stats.totalItems)}</b>
💰 نرخی ستۆک: <b>${formatNumber(stats.totalStockValue)}</b> د.ع
⚠️ کاڵای کەمبوو: <b>${stats.lowStockCount}</b>
❌ کاڵای بەسەرچوو: <b>${stats.expiredCount}</b>
⏰ نزیک لە بەسەرچوون: <b>${stats.expiringSoonCount}</b>`);
        break;
        
      case "/report":
        await sendTelegramMessage(chatId, "⏳ ڕاپۆرت ئامادە دەکرێت...");
        const report = await generateFullReport();
        await sendTelegramMessage(chatId, report);
        break;
        
      case "/expiring":
        const expiringItems = await getExpiringItems();
        if (expiringItems.length === 0) {
          await sendTelegramMessage(chatId, "✅ هیچ کاڵایەک نزیک لە بەسەرچوون نییە!");
        } else {
          let response = `⏰ <b>کاڵاکانی نزیک لە بەسەرچوون (${expiringItems.length}):</b>\n\n`;
          expiringItems.forEach((item) => {
            response += formatItem(item) + "\n\n";
          });
          await sendTelegramMessage(chatId, response);
        }
        break;
        
      case "/expired":
        const expiredItems = await getExpiredItems();
        if (expiredItems.length === 0) {
          await sendTelegramMessage(chatId, "✅ هیچ کاڵایەکی بەسەرچوو نییە!");
        } else {
          let response = `❌ <b>کاڵا بەسەرچووەکان (${expiredItems.length}):</b>\n\n`;
          expiredItems.forEach((item) => {
            response += formatItem(item) + "\n\n";
          });
          await sendTelegramMessage(chatId, response);
        }
        break;
        
      case "/lowstock":
        const lowStockItems = await getLowStockItems();
        if (lowStockItems.length === 0) {
          await sendTelegramMessage(chatId, "✅ هەموو کاڵاکان بڕیان تەواوە!");
        } else {
          let response = `⚠️ <b>کاڵاکانی کەمبوو (${lowStockItems.length}):</b>\n\n`;
          lowStockItems.forEach((item) => {
            const minStock = item.min_stock || 0;
            response += formatItem(item) + `\n⚠️ کەمترین پێویست: ${minStock}\n\n`;
          });
          await sendTelegramMessage(chatId, response);
        }
        break;
        
      case "/search":
        if (!args) {
          await sendTelegramMessage(chatId, "❓ تکایە ناو یان بارکۆدی کاڵا بنووسە.\n\n<b>نموونە:</b>\n<code>/search پێپسی</code>");
        } else {
          const searchResults = await searchItems(args);
          if (searchResults.length === 0) {
            await sendTelegramMessage(chatId, `🔍 هیچ کاڵایەک نەدۆزرایەوە بۆ: "${args}"`);
          } else {
            let response = `🔍 <b>ئەنجامی گەڕان بۆ "${args}" (${searchResults.length}):</b>\n\n`;
            searchResults.forEach((item) => {
              response += formatItem(item) + "\n\n";
            });
            await sendTelegramMessage(chatId, response);
          }
        }
        break;
        
      case "/subscribe":
        await saveChatId(chatId);
        await sendTelegramMessage(chatId, `✅ <b>ئاگادارکردنەوەی ڕۆژانە چالاک کرا!</b>

هەر ڕۆژێک کاتژمێر ٨:٠٠ی بەیانی ئاگادارت دەکەینەوە لە:
• کاڵا بەسەرچووەکان
• کاڵا نزیک لە بەسەرچوون
• کاڵا کەمبووەکان`);
        break;
        
      case "/unsubscribe":
        await removeChatId(chatId);
        await sendTelegramMessage(chatId, "🔕 ئاگادارکردنەوەی ڕۆژانە ناچالاک کرا.");
        break;
        
      default:
        await sendTelegramMessage(chatId, `❓ فەرمانی نەناسراو. بنووسە /help بۆ بینینی فەرمانەکان.`);
    }
  } catch (error) {
    console.error("Error handling update:", error);
    await sendTelegramMessage(chatId, "❌ هەڵەیەک ڕوویدا. تکایە دووبارە هەوڵ بدەرەوە.");
  }
}

// Save chat ID for notifications
async function saveChatId(chatId: number | string) {
  // Using localStorage-like approach with a simple table or just keeping it in memory
  // For production, you'd want to create a telegram_subscribers table
  console.log(`Saving chat ID for notifications: ${chatId}`);
  
  // Check if table exists and insert
  const { error } = await supabase
    .from("telegram_subscribers")
    .upsert({ chat_id: chatId.toString() }, { onConflict: "chat_id" });
  
  if (error) {
    console.log("Note: telegram_subscribers table might not exist yet:", error.message);
  }
}

// Remove chat ID from notifications
async function removeChatId(chatId: number | string) {
  const { error } = await supabase
    .from("telegram_subscribers")
    .delete()
    .eq("chat_id", chatId.toString());
  
  if (error) {
    console.log("Note: Could not remove chat ID:", error.message);
  }
}

// Get all subscribed chat IDs
async function getSubscribedChatIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from("telegram_subscribers")
    .select("chat_id");
  
  if (error) {
    console.log("Note: Could not fetch subscribers:", error.message);
    return [];
  }
  
  return (data || []).map(row => row.chat_id);
}

// Send daily notifications to all subscribers
async function sendDailyNotifications() {
  console.log("Sending daily notifications...");
  
  const chatIds = await getSubscribedChatIds();
  if (chatIds.length === 0) {
    console.log("No subscribers found");
    return { sent: 0 };
  }
  
  const notification = await generateDailyNotification();
  if (!notification) {
    console.log("No issues to notify about");
    return { sent: 0, reason: "no_issues" };
  }
  
  let sentCount = 0;
  for (const chatId of chatIds) {
    try {
      await sendTelegramMessage(chatId, notification);
      sentCount++;
      console.log(`Notification sent to: ${chatId}`);
    } catch (error) {
      console.error(`Failed to send to ${chatId}:`, error);
    }
  }
  
  return { sent: sentCount, total: chatIds.length };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Daily notification endpoint (for cron job)
    if (req.method === "POST" && url.searchParams.get("action") === "daily-notify") {
      const result = await sendDailyNotifications();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Webhook endpoint for Telegram
    if (req.method === "POST") {
      const update = await req.json();
      console.log("Received Telegram update:", JSON.stringify(update));
      
      await handleUpdate(update);
      
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Setup webhook endpoint
    if (req.method === "GET" && url.searchParams.get("setup") === "true") {
      const webhookUrl = `${SUPABASE_URL}/functions/v1/telegram-bot`;
      const setWebhookUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
      
      const response = await fetch(setWebhookUrl);
      const result = await response.json();
      
      console.log("Webhook setup result:", result);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    return new Response(JSON.stringify({ status: "Bot is running" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error: unknown) {
    console.error("Error in telegram-bot function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
