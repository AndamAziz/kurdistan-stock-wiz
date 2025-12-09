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

// Get low stock items
async function getLowStockItems() {
  const { data, error } = await supabase
    .from("items")
    .select("*, categories(name), brands(name)")
    .filter("current_quantity", "lte", "min_stock")
    .gt("current_quantity", 0)
    .order("current_quantity", { ascending: true })
    .limit(20);
  
  if (error) {
    console.error("Error fetching low stock items:", error);
    return [];
  }
  
  return data || [];
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

// Get dashboard stats
async function getDashboardStats() {
  const today = new Date().toISOString().split("T")[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  
  // Total items count
  const { count: totalItems } = await supabase
    .from("items")
    .select("*", { count: "exact", head: true });
  
  // Low stock count
  const { count: lowStockCount } = await supabase
    .from("items")
    .select("*", { count: "exact", head: true })
    .filter("current_quantity", "lte", "min_stock")
    .gt("current_quantity", 0);
  
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
  
  return {
    totalItems: totalItems || 0,
    lowStockCount: lowStockCount || 0,
    expiredCount: expiredCount || 0,
    expiringSoonCount: expiringSoonCount || 0,
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
        await sendTelegramMessage(chatId, `👋 <b>بەخێربێیت بۆ بۆتی باکوری خۆشەویست!</b>

ئەم بۆتە یارمەتیت دەدات بۆ بەڕێوەبردنی کۆگاکەت.

<b>فەرمانەکان:</b>
/stats - ئامارەکانی کۆگا
/expiring - کاڵا نزیک لە بەسەرچوون
/expired - کاڵا بەسەرچووەکان
/lowstock - کاڵا کەمبووەکان
/search [ناو/بارکۆد] - گەڕان بۆ کاڵا
/help - یارمەتی`);
        break;
        
      case "/help":
        await sendTelegramMessage(chatId, `📚 <b>لیستی فەرمانەکان:</b>

/stats - ئامارەکانی گشتی کۆگا
/expiring - کاڵاکانی نزیک لە بەسەرچوون (٣٠ ڕۆژ)
/expired - کاڵا بەسەرچووەکان
/lowstock - کاڵاکانی کەمبوون
/search [ناو یان بارکۆد] - گەڕان بۆ کاڵا

<b>نموونە:</b>
<code>/search پێپسی</code>
<code>/search 123456789</code>`);
        break;
        
      case "/stats":
        const stats = await getDashboardStats();
        await sendTelegramMessage(chatId, `📊 <b>ئامارەکانی کۆگا:</b>

📦 کۆی کاڵاکان: <b>${stats.totalItems}</b>
⚠️ کاڵای کەمبوو: <b>${stats.lowStockCount}</b>
❌ کاڵای بەسەرچوو: <b>${stats.expiredCount}</b>
⏰ نزیک لە بەسەرچوون: <b>${stats.expiringSoonCount}</b>`);
        break;
        
      case "/expiring":
        const expiringItems = await getExpiringItems();
        if (expiringItems.length === 0) {
          await sendTelegramMessage(chatId, "✅ هیچ کاڵایەک نزیک لە بەسەرچوون نییە!");
        } else {
          let response = `⏰ <b>کاڵاکانی نزیک لە بەسەرچوون (${expiringItems.length}):</b>\n\n`;
          expiringItems.forEach((item, index) => {
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
        
      default:
        await sendTelegramMessage(chatId, `❓ فەرمانی نەناسراو. بنووسە /help بۆ بینینی فەرمانەکان.`);
    }
  } catch (error) {
    console.error("Error handling update:", error);
    await sendTelegramMessage(chatId, "❌ هەڵەیەک ڕوویدا. تکایە دووبارە هەوڵ بدەرەوە.");
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
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
