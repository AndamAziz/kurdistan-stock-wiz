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

// In-memory conversation state (for multi-step commands)
const conversationState: Map<string, any> = new Map();

// Send message to Telegram
async function sendTelegramMessage(chatId: number | string, text: string, parseMode = "HTML", replyMarkup?: any) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const body: any = {
    chat_id: chatId,
    text: text,
    parse_mode: parseMode,
  };
  
  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }
  
  console.log(`Sending message to ${chatId}: ${text.substring(0, 100)}...`);
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  
  const result = await response.json();
  console.log(`Telegram API response:`, JSON.stringify(result));
  return result;
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
    .gt("current_quantity", 0)
    .order("current_quantity", { ascending: true });
  
  if (error) {
    console.error("Error fetching low stock items:", error);
    return [];
  }
  
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

// Get item by barcode
async function getItemByBarcode(barcode: string) {
  const { data, error } = await supabase
    .from("items")
    .select("*, categories(name), brands(name)")
    .eq("barcode", barcode)
    .maybeSingle();
  
  if (error) {
    console.error("Error fetching item by barcode:", error);
    return null;
  }
  
  return data;
}

// Get all categories
async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  
  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
  
  return data || [];
}

// Get all brands
async function getBrands() {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("name");
  
  if (error) {
    console.error("Error fetching brands:", error);
    return [];
  }
  
  return data || [];
}

// Add new item
async function addItem(itemData: any) {
  const { data, error } = await supabase
    .from("items")
    .insert([itemData])
    .select()
    .single();
  
  if (error) {
    console.error("Error adding item:", error);
    return { error };
  }
  
  return { data };
}

// Update item
async function updateItem(itemId: string, itemData: any) {
  const { data, error } = await supabase
    .from("items")
    .update(itemData)
    .eq("id", itemId)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating item:", error);
    return { error };
  }
  
  return { data };
}

// Delete item
async function deleteItem(itemId: string) {
  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", itemId);
  
  if (error) {
    console.error("Error deleting item:", error);
    return { error };
  }
  
  return { success: true };
}

// Add stock movement
async function addStockMovement(movementData: any) {
  const { data, error } = await supabase
    .from("stock_movements")
    .insert([movementData])
    .select()
    .single();
  
  if (error) {
    console.error("Error adding stock movement:", error);
    return { error };
  }
  
  return { data };
}

// Get dashboard stats
async function getDashboardStats() {
  const today = new Date().toISOString().split("T")[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  
  const { count: totalItems } = await supabase
    .from("items")
    .select("*", { count: "exact", head: true });
  
  const { data: allItems } = await supabase
    .from("items")
    .select("current_quantity, min_stock")
    .gt("current_quantity", 0);
  
  const lowStockCount = (allItems || []).filter(item => item.current_quantity <= item.min_stock).length;
  
  const { count: expiredCount } = await supabase
    .from("items")
    .select("*", { count: "exact", head: true })
    .lt("exp_date", today)
    .gt("current_quantity", 0);
  
  const { count: expiringSoonCount } = await supabase
    .from("items")
    .select("*", { count: "exact", head: true })
    .lte("exp_date", futureDate.toISOString().split("T")[0])
    .gte("exp_date", today);
  
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
    lowStockCount,
    expiredCount: expiredCount || 0,
    expiringSoonCount: expiringSoonCount || 0,
    totalStockValue,
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

// Parse date from user input (supports YYYY-MM-DD or DD/MM/YYYY)
function parseDate(input: string): string | null {
  // Try YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }
  
  // Try DD/MM/YYYY format
  const match = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  
  return null;
}

// Handle /add command flow - conversational step by step
async function handleAddCommand(chatId: string, text: string, state: any) {
  const step = state?.step || 0;
  
  console.log(`handleAddCommand - chatId: ${chatId}, step: ${step}, text: ${text}`);
  
  switch (step) {
    case 0:
      // Start - ask for item name
      conversationState.set(chatId, { command: "add", step: 1, data: {} });
      await sendTelegramMessage(chatId, `📦 <b>زیادکردنی کاڵای نوێ</b>

ئێستا یەک بە یەک زانیاریەکان دەپرسم:

<b>پرسیاری ١:</b> ناوی کاڵا چییە؟

<i>تکایە تەنها ناوی کاڵاکە بنووسە:</i>
<i>🔙 بۆ هەڵوەشاندنەوە: /cancel</i>`);
      break;
      
    case 1:
      // Got name - ask for barcode
      state.data.name = text.trim();
      state.step = 2;
      conversationState.set(chatId, state);
      await sendTelegramMessage(chatId, `✅ ناو: <b>${state.data.name}</b>

<b>پرسیاری ٢:</b> بارکۆدی کاڵاکە چەندە؟

<i>تکایە بارکۆدەکە بنووسە:</i>`);
      break;
      
    case 2:
      // Got barcode - check if exists, ask for quantity
      const barcode = text.trim();
      const existingItem = await getItemByBarcode(barcode);
      
      if (existingItem) {
        conversationState.delete(chatId);
        await sendTelegramMessage(chatId, `❌ <b>ئەم بارکۆدە پێشتر هەیە!</b>

📦 ${existingItem.name}
بڕی ئێستا: ${existingItem.current_quantity}

بۆ زیادکردنی ستۆک /stockin بەکاربهێنە.`);
        return;
      }
      
      state.data.barcode = barcode;
      state.step = 3;
      conversationState.set(chatId, state);
      await sendTelegramMessage(chatId, `✅ بارکۆد: <code>${barcode}</code>

<b>پرسیاری ٣:</b> بڕی سەرەتایی چەندە؟

<i>تکایە ژمارەیەک بنووسە (نموونە: 50):</i>`);
      break;
      
    case 3:
      // Got quantity - ask for unit
      const qty = parseInt(text.trim());
      if (isNaN(qty) || qty < 0) {
        await sendTelegramMessage(chatId, `❌ تکایە <b>ژمارەیەکی ڕاست</b> بنووسە:
        
<i>نموونە: 50</i>`);
        return;
      }
      
      state.data.current_quantity = qty;
      state.step = 4;
      conversationState.set(chatId, state);
      
      await sendTelegramMessage(chatId, `✅ بڕ: <b>${qty}</b>

<b>پرسیاری ٤:</b> یەکەی کاڵاکە چییە؟

<i>نموونە: دانە، کارتۆن، کیلۆ، پاکێت</i>`);
      break;
      
    case 4:
      // Got unit - ask for expiry date
      state.data.unit = text.trim() || "دانە";
      state.step = 5;
      conversationState.set(chatId, state);
      
      await sendTelegramMessage(chatId, `✅ یەکە: <b>${state.data.unit}</b>

<b>پرسیاری ٥:</b> بەرواری بەسەرچوون چەندە؟

<i>فۆرمات: 25/12/2025 یان 2025-12-25</i>
<i>ئەگەر بەسەرچوون نییە بنووسە: <b>نییە</b></i>`);
      break;
      
    case 5:
      // Got expiry - confirm and save
      const expInput = text.trim().toLowerCase();
      
      if (expInput !== "نییە" && expInput !== "no" && expInput !== "-") {
        const expDate = parseDate(text.trim());
        if (!expDate) {
          await sendTelegramMessage(chatId, `❌ فۆرماتی بەروار <b>هەڵەیە</b>!

تکایە بەم شێوازە بنووسە:
• 25/12/2025
• 2025-12-25
• یان بنووسە: <b>نییە</b>`);
          return;
        }
        state.data.exp_date = expDate;
      }
      
      // Save the item
      const itemData = {
        name: state.data.name,
        barcode: state.data.barcode,
        current_quantity: state.data.current_quantity,
        unit: state.data.unit,
        exp_date: state.data.exp_date || null,
        min_stock: 10,
      };
      
      const result = await addItem(itemData);
      conversationState.delete(chatId);
      
      if (result.error) {
        await sendTelegramMessage(chatId, `❌ <b>هەڵە لە زیادکردن!</b>

${result.error.message}

تکایە دووبارە هەوڵ بدەرەوە: /add`);
        return;
      }
      
      await sendTelegramMessage(chatId, `🎉 <b>کاڵا بە سەرکەوتوویی زیادکرا!</b>

━━━━━━━━━━━━━━━━━━━━

📦 <b>${itemData.name}</b>
├ 🏷️ بارکۆد: <code>${itemData.barcode}</code>
├ 📊 بڕ: ${itemData.current_quantity} ${itemData.unit}
└ 📅 بەسەرچوون: ${itemData.exp_date || "نییە"}

━━━━━━━━━━━━━━━━━━━━

📥 بۆ زیادکردنی ستۆک: /stockin
📤 بۆ دەرکردن: /stockout`);
      break;
  }
}

// Handle /stockin command flow - conversational step by step
async function handleStockInCommand(chatId: string, text: string, state: any) {
  const step = state?.step || 0;
  
  console.log(`handleStockInCommand - chatId: ${chatId}, step: ${step}, text: ${text}`);
  
  switch (step) {
    case 0:
      // Start - ask for barcode or name
      conversationState.set(chatId, { command: "stockin", step: 1, data: {} });
      await sendTelegramMessage(chatId, `📥 <b>داخڵکردنی ستۆک</b>

ئێستا یەک بە یەک زانیاریەکان دەپرسم:

<b>پرسیاری ١:</b> کام کاڵا دەتەوێت ستۆکی بۆ زیاد بکەیت؟

<i>تکایە بارکۆد یان ناوی کاڵاکە بنووسە:</i>
<i>🔙 بۆ هەڵوەشاندنەوە: /cancel</i>`);
      break;
      
    case 1:
      // Got search query - find item
      const query = text.trim();
      const items = await searchItems(query);
      
      if (items.length === 0) {
        conversationState.delete(chatId);
        await sendTelegramMessage(chatId, `❌ <b>هیچ کاڵایەک نەدۆزرایەوە!</b>

گەڕان بۆ: "${query}"

📦 بۆ زیادکردنی کاڵای نوێ: /add
🔄 بۆ دووبارە هەوڵدان: /stockin`);
        return;
      }
      
      if (items.length === 1) {
        // Found exactly one item
        state.data.item = items[0];
        state.step = 2;
        conversationState.set(chatId, state);
        
        await sendTelegramMessage(chatId, `✅ <b>کاڵا دۆزرایەوە:</b>

📦 <b>${items[0].name}</b>
├ 🏷️ بارکۆد: <code>${items[0].barcode}</code>
└ 📊 بڕی ئێستا: ${items[0].current_quantity} ${items[0].unit}

<b>پرسیاری ٢:</b> چەند دانە دەخەیتە ستۆکەوە؟

<i>تکایە ژمارەیەک بنووسە:</i>`);
      } else {
        // Multiple items found - let user choose
        state.data.searchResults = items;
        state.step = 1.5;
        conversationState.set(chatId, state);
        
        let response = `🔍 <b>چەندین کاڵا دۆزرایەوە:</b>\n\n`;
        items.forEach((item, index) => {
          response += `<b>${index + 1}.</b> ${item.name}\n   📊 ${item.current_quantity} ${item.unit}\n   🏷️ <code>${item.barcode}</code>\n\n`;
        });
        response += `<b>تکایە ژمارەی کاڵاکە بنووسە (1-${items.length}):</b>`;
        
        await sendTelegramMessage(chatId, response);
      }
      break;
      
    case 1.5:
      // User selecting from multiple items
      const selection = parseInt(text.trim());
      if (isNaN(selection) || selection < 1 || selection > state.data.searchResults.length) {
        await sendTelegramMessage(chatId, `❌ تکایە ژمارەیەک لە <b>1</b> تا <b>${state.data.searchResults.length}</b> بنووسە:`);
        return;
      }
      
      state.data.item = state.data.searchResults[selection - 1];
      delete state.data.searchResults;
      state.step = 2;
      conversationState.set(chatId, state);
      
      await sendTelegramMessage(chatId, `✅ <b>هەڵبژێردرا:</b>

📦 <b>${state.data.item.name}</b>
└ 📊 بڕی ئێستا: ${state.data.item.current_quantity} ${state.data.item.unit}

<b>پرسیاری ٢:</b> چەند دانە دەخەیتە ستۆکەوە؟

<i>تکایە ژمارەیەک بنووسە:</i>`);
      break;
      
    case 2:
      // Got quantity - ask for note
      const inQty = parseInt(text.trim());
      if (isNaN(inQty) || inQty <= 0) {
        await sendTelegramMessage(chatId, `❌ تکایە ژمارەیەکی <b>گەورەتر لە سفر</b> بنووسە:`);
        return;
      }
      
      state.data.quantity = inQty;
      state.step = 3;
      conversationState.set(chatId, state);
      
      await sendTelegramMessage(chatId, `✅ بڕی داخڵکردن: <b>${inQty}</b>

<b>پرسیاری ٣:</b> تێبینیت هەیە؟

<i>نموونە: کڕین لە کۆمپانیای X</i>
<i>ئەگەر تێبینی نییە بنووسە: <b>-</b></i>`);
      break;
      
    case 3:
      // Got note - save movement
      const note = text.trim() === "-" ? null : text.trim();
      
      const movementData = {
        item_id: state.data.item.id,
        movement_type: "IN",
        quantity: state.data.quantity,
        note: note,
        movement_date: new Date().toISOString().split("T")[0],
      };
      
      const mvResult = await addStockMovement(movementData);
      conversationState.delete(chatId);
      
      if (mvResult.error) {
        await sendTelegramMessage(chatId, `❌ <b>هەڵە لە تۆمارکردن!</b>

${mvResult.error.message}

تکایە دووبارە هەوڵ بدەرەوە: /stockin`);
        return;
      }
      
      const newQty = state.data.item.current_quantity + state.data.quantity;
      
      await sendTelegramMessage(chatId, `🎉 <b>داخڵکردن بە سەرکەوتوویی تۆمارکرا!</b>

━━━━━━━━━━━━━━━━━━━━

📦 <b>${state.data.item.name}</b>
├ ➕ داخڵکراو: <b>+${state.data.quantity}</b> ${state.data.item.unit}
├ 📊 بڕی پێشوو: ${state.data.item.current_quantity}
├ 📊 بڕی نوێ: <b>${newQty}</b>
└ 📝 تێبینی: ${note || "نییە"}

━━━━━━━━━━━━━━━━━━━━

📥 بۆ داخڵکردنی زیاتر: /stockin
📤 بۆ دەرکردن: /stockout`);
      break;
  }
}

// Handle /stockout command flow - conversational step by step
async function handleStockOutCommand(chatId: string, text: string, state: any) {
  const step = state?.step || 0;
  
  console.log(`handleStockOutCommand - chatId: ${chatId}, step: ${step}, text: ${text}`);
  
  switch (step) {
    case 0:
      // Start - ask for barcode or name
      conversationState.set(chatId, { command: "stockout", step: 1, data: {} });
      await sendTelegramMessage(chatId, `📤 <b>دەرکردنی ستۆک</b>

ئێستا یەک بە یەک زانیاریەکان دەپرسم:

<b>پرسیاری ١:</b> کام کاڵا دەتەوێت لە ستۆک دەربکەیت؟

<i>تکایە بارکۆد یان ناوی کاڵاکە بنووسە:</i>
<i>🔙 بۆ هەڵوەشاندنەوە: /cancel</i>`);
      break;
      
    case 1:
      // Got search query - find item
      const query = text.trim();
      const items = await searchItems(query);
      
      if (items.length === 0) {
        conversationState.delete(chatId);
        await sendTelegramMessage(chatId, `❌ <b>هیچ کاڵایەک نەدۆزرایەوە!</b>

گەڕان بۆ: "${query}"

🔄 بۆ دووبارە هەوڵدان: /stockout`);
        return;
      }
      
      if (items.length === 1) {
        if (items[0].current_quantity <= 0) {
          conversationState.delete(chatId);
          await sendTelegramMessage(chatId, `❌ <b>ئەم کاڵایە بڕی نییە!</b>

📦 ${items[0].name}
📊 بڕی ئێستا: 0

📥 بۆ داخڵکردنی ستۆک: /stockin`);
          return;
        }
        
        state.data.item = items[0];
        state.step = 2;
        conversationState.set(chatId, state);
        
        await sendTelegramMessage(chatId, `✅ <b>کاڵا دۆزرایەوە:</b>

📦 <b>${items[0].name}</b>
├ 🏷️ بارکۆد: <code>${items[0].barcode}</code>
└ 📊 بڕی بەردەست: <b>${items[0].current_quantity}</b> ${items[0].unit}

<b>پرسیاری ٢:</b> چەند دانە دەردەکەیت؟

<i>تکایە ژمارەیەک بنووسە (کەمتر لە ${items[0].current_quantity}):</i>`);
      } else {
        state.data.searchResults = items;
        state.step = 1.5;
        conversationState.set(chatId, state);
        
        let response = `🔍 <b>چەندین کاڵا دۆزرایەوە:</b>\n\n`;
        items.forEach((item, index) => {
          response += `<b>${index + 1}.</b> ${item.name}\n   📊 ${item.current_quantity} ${item.unit}\n   🏷️ <code>${item.barcode}</code>\n\n`;
        });
        response += `<b>تکایە ژمارەی کاڵاکە بنووسە (1-${items.length}):</b>`;
        
        await sendTelegramMessage(chatId, response);
      }
      break;
      
    case 1.5:
      // User selecting from multiple items
      const selection = parseInt(text.trim());
      if (isNaN(selection) || selection < 1 || selection > state.data.searchResults.length) {
        await sendTelegramMessage(chatId, `❌ تکایە ژمارەیەک لە <b>1</b> تا <b>${state.data.searchResults.length}</b> بنووسە:`);
        return;
      }
      
      const selectedItem = state.data.searchResults[selection - 1];
      if (selectedItem.current_quantity <= 0) {
        conversationState.delete(chatId);
        await sendTelegramMessage(chatId, `❌ <b>ئەم کاڵایە بڕی نییە!</b>

📥 بۆ داخڵکردنی ستۆک: /stockin`);
        return;
      }
      
      state.data.item = selectedItem;
      delete state.data.searchResults;
      state.step = 2;
      conversationState.set(chatId, state);
      
      await sendTelegramMessage(chatId, `✅ <b>هەڵبژێردرا:</b>

📦 <b>${state.data.item.name}</b>
└ 📊 بڕی بەردەست: <b>${state.data.item.current_quantity}</b> ${state.data.item.unit}

<b>پرسیاری ٢:</b> چەند دانە دەردەکەیت؟

<i>تکایە ژمارەیەک بنووسە (کەمتر لە ${state.data.item.current_quantity}):</i>`);
      break;
      
    case 2:
      // Got quantity - validate and ask for note
      const outQty = parseInt(text.trim());
      if (isNaN(outQty) || outQty <= 0) {
        await sendTelegramMessage(chatId, `❌ تکایە ژمارەیەکی <b>گەورەتر لە سفر</b> بنووسە:`);
        return;
      }
      
      if (outQty > state.data.item.current_quantity) {
        await sendTelegramMessage(chatId, `❌ <b>بڕی داواکراو زیاترە لە بڕی بەردەست!</b>

📊 بڕی بەردەست: ${state.data.item.current_quantity} ${state.data.item.unit}

<i>تکایە بڕێکی کەمتر بنووسە:</i>`);
        return;
      }
      
      state.data.quantity = outQty;
      state.step = 3;
      conversationState.set(chatId, state);
      
      await sendTelegramMessage(chatId, `✅ بڕی دەرکردن: <b>${outQty}</b>

<b>پرسیاری ٣:</b> تێبینیت هەیە؟

<i>نموونە: فرۆشتن بە کڕیاری X</i>
<i>ئەگەر تێبینی نییە بنووسە: <b>-</b></i>`);
      break;
      
    case 3:
      // Got note - save movement
      const note = text.trim() === "-" ? null : text.trim();
      
      const movementData = {
        item_id: state.data.item.id,
        movement_type: "OUT",
        quantity: state.data.quantity,
        note: note,
        movement_date: new Date().toISOString().split("T")[0],
      };
      
      const mvResult = await addStockMovement(movementData);
      conversationState.delete(chatId);
      
      if (mvResult.error) {
        await sendTelegramMessage(chatId, `❌ <b>هەڵە لە تۆمارکردن!</b>

${mvResult.error.message}

تکایە دووبارە هەوڵ بدەرەوە: /stockout`);
        return;
      }
      
      const newQty = state.data.item.current_quantity - state.data.quantity;
      
      await sendTelegramMessage(chatId, `🎉 <b>دەرکردن بە سەرکەوتوویی تۆمارکرا!</b>

━━━━━━━━━━━━━━━━━━━━

📦 <b>${state.data.item.name}</b>
├ ➖ دەرکراو: <b>-${state.data.quantity}</b> ${state.data.item.unit}
├ 📊 بڕی پێشوو: ${state.data.item.current_quantity}
├ 📊 بڕی نوێ: <b>${newQty}</b>
└ 📝 تێبینی: ${note || "نییە"}

━━━━━━━━━━━━━━━━━━━━

📤 بۆ دەرکردنی زیاتر: /stockout
📥 بۆ داخڵکردن: /stockin`);
      break;
  }
}

// Handle /edit command flow - conversational step by step
async function handleEditCommand(chatId: string, text: string, state: any) {
  const step = state?.step || 0;
  
  console.log(`handleEditCommand - chatId: ${chatId}, step: ${step}, text: ${text}`);
  
  switch (step) {
    case 0:
      // Start - ask for barcode or name
      conversationState.set(chatId, { command: "edit", step: 1, data: {} });
      await sendTelegramMessage(chatId, `✏️ <b>دەستکاری کاڵا</b>

<b>پرسیاری ١:</b> کام کاڵا دەتەوێت دەستکاری بکەیت؟

<i>تکایە بارکۆد یان ناوی کاڵاکە بنووسە:</i>
<i>🔙 بۆ هەڵوەشاندنەوە: /cancel</i>`);
      break;
      
    case 1:
      // Got search query - find item
      const query = text.trim();
      const items = await searchItems(query);
      
      if (items.length === 0) {
        conversationState.delete(chatId);
        await sendTelegramMessage(chatId, `❌ <b>هیچ کاڵایەک نەدۆزرایەوە!</b>

گەڕان بۆ: "${query}"

🔄 بۆ دووبارە هەوڵدان: /edit`);
        return;
      }
      
      if (items.length === 1) {
        state.data.item = items[0];
        state.step = 2;
        conversationState.set(chatId, state);
        
        await sendTelegramMessage(chatId, `✅ <b>کاڵا دۆزرایەوە:</b>

📦 <b>${items[0].name}</b>
├ 🏷️ بارکۆد: <code>${items[0].barcode}</code>
├ 📊 بڕ: ${items[0].current_quantity} ${items[0].unit}
└ 📅 بەسەرچوون: ${items[0].exp_date || "نییە"}

<b>پرسیاری ٢:</b> چی دەتەوێت بگۆڕیت؟

<b>1.</b> ناو
<b>2.</b> بارکۆد
<b>3.</b> یەکە
<b>4.</b> بەرواری بەسەرچوون
<b>5.</b> کەمترین ستۆک

<i>تکایە ژمارە بنووسە (1-5):</i>`);
      } else {
        state.data.searchResults = items;
        state.step = 1.5;
        conversationState.set(chatId, state);
        
        let response = `🔍 <b>چەندین کاڵا دۆزرایەوە:</b>\n\n`;
        items.forEach((item, index) => {
          response += `<b>${index + 1}.</b> ${item.name}\n   📊 ${item.current_quantity} ${item.unit}\n   🏷️ <code>${item.barcode}</code>\n\n`;
        });
        response += `<b>تکایە ژمارەی کاڵاکە بنووسە (1-${items.length}):</b>`;
        
        await sendTelegramMessage(chatId, response);
      }
      break;
      
    case 1.5:
      // User selecting from multiple items
      const selection = parseInt(text.trim());
      if (isNaN(selection) || selection < 1 || selection > state.data.searchResults.length) {
        await sendTelegramMessage(chatId, `❌ تکایە ژمارەیەک لە <b>1</b> تا <b>${state.data.searchResults.length}</b> بنووسە:`);
        return;
      }
      
      state.data.item = state.data.searchResults[selection - 1];
      delete state.data.searchResults;
      state.step = 2;
      conversationState.set(chatId, state);
      
      await sendTelegramMessage(chatId, `✅ <b>هەڵبژێردرا:</b>

📦 <b>${state.data.item.name}</b>
├ 🏷️ بارکۆد: <code>${state.data.item.barcode}</code>
├ 📊 بڕ: ${state.data.item.current_quantity} ${state.data.item.unit}
└ 📅 بەسەرچوون: ${state.data.item.exp_date || "نییە"}

<b>پرسیاری ٢:</b> چی دەتەوێت بگۆڕیت؟

<b>1.</b> ناو
<b>2.</b> بارکۆد
<b>3.</b> یەکە
<b>4.</b> بەرواری بەسەرچوون
<b>5.</b> کەمترین ستۆک

<i>تکایە ژمارە بنووسە (1-5):</i>`);
      break;
      
    case 2:
      // User selecting what to edit
      const editChoice = parseInt(text.trim());
      if (isNaN(editChoice) || editChoice < 1 || editChoice > 5) {
        await sendTelegramMessage(chatId, `❌ تکایە ژمارەیەک لە <b>1</b> تا <b>5</b> بنووسە:`);
        return;
      }
      
      state.data.editField = editChoice;
      state.step = 3;
      conversationState.set(chatId, state);
      
      const fieldNames = ["ناو", "بارکۆد", "یەکە", "بەرواری بەسەرچوون", "کەمترین ستۆک"];
      const currentValues = [
        state.data.item.name,
        state.data.item.barcode,
        state.data.item.unit,
        state.data.item.exp_date || "نییە",
        state.data.item.min_stock
      ];
      
      await sendTelegramMessage(chatId, `✅ دەستکاری: <b>${fieldNames[editChoice - 1]}</b>

📋 نرخی ئێستا: <b>${currentValues[editChoice - 1]}</b>

<b>پرسیاری ٣:</b> نرخی نوێ چییە؟

<i>تکایە نرخی نوێ بنووسە:</i>`);
      break;
      
    case 3:
      // Got new value - update item
      const newValue = text.trim();
      const field = state.data.editField;
      
      let updateData: any = {};
      
      switch (field) {
        case 1: // name
          updateData.name = newValue;
          break;
        case 2: // barcode
          const existingItem = await getItemByBarcode(newValue);
          if (existingItem && existingItem.id !== state.data.item.id) {
            await sendTelegramMessage(chatId, `❌ <b>ئەم بارکۆدە پێشتر هەیە!</b>

📦 ${existingItem.name}

تکایە بارکۆدێکی جیاواز بنووسە:`);
            return;
          }
          updateData.barcode = newValue;
          break;
        case 3: // unit
          updateData.unit = newValue;
          break;
        case 4: // exp_date
          if (newValue.toLowerCase() === "نییە" || newValue === "-") {
            updateData.exp_date = null;
          } else {
            const expDate = parseDate(newValue);
            if (!expDate) {
              await sendTelegramMessage(chatId, `❌ فۆرماتی بەروار <b>هەڵەیە</b>!

تکایە بەم شێوازە بنووسە:
• 25/12/2025
• 2025-12-25
• یان بنووسە: <b>نییە</b>`);
              return;
            }
            updateData.exp_date = expDate;
          }
          break;
        case 5: // min_stock
          const minStock = parseInt(newValue);
          if (isNaN(minStock) || minStock < 0) {
            await sendTelegramMessage(chatId, `❌ تکایە ژمارەیەکی ڕاست بنووسە:`);
            return;
          }
          updateData.min_stock = minStock;
          break;
      }
      
      const result = await updateItem(state.data.item.id, updateData);
      conversationState.delete(chatId);
      
      if (result.error) {
        await sendTelegramMessage(chatId, `❌ <b>هەڵە لە نوێکردنەوە!</b>

${result.error.message}

تکایە دووبارە هەوڵ بدەرەوە: /edit`);
        return;
      }
      
      const fieldNames2 = ["ناو", "بارکۆد", "یەکە", "بەرواری بەسەرچوون", "کەمترین ستۆک"];
      
      await sendTelegramMessage(chatId, `🎉 <b>کاڵا بە سەرکەوتوویی نوێکرایەوە!</b>

━━━━━━━━━━━━━━━━━━━━

📦 <b>${result.data.name}</b>
├ ✏️ گۆڕاو: ${fieldNames2[field - 1]}
└ 📋 نرخی نوێ: <b>${newValue}</b>

━━━━━━━━━━━━━━━━━━━━

✏️ بۆ دەستکاری زیاتر: /edit`);
      break;
  }
}

// Handle /delete command flow - conversational step by step
async function handleDeleteCommand(chatId: string, text: string, state: any) {
  const step = state?.step || 0;
  
  console.log(`handleDeleteCommand - chatId: ${chatId}, step: ${step}, text: ${text}`);
  
  switch (step) {
    case 0:
      // Start - ask for barcode or name
      conversationState.set(chatId, { command: "delete", step: 1, data: {} });
      await sendTelegramMessage(chatId, `🗑️ <b>سڕینەوەی کاڵا</b>

⚠️ <b>ئاگاداری:</b> سڕینەوە ناگەڕێتەوە!

<b>پرسیاری ١:</b> کام کاڵا دەتەوێت بسڕیتەوە؟

<i>تکایە بارکۆد یان ناوی کاڵاکە بنووسە:</i>
<i>🔙 بۆ هەڵوەشاندنەوە: /cancel</i>`);
      break;
      
    case 1:
      // Got search query - find item
      const query = text.trim();
      const items = await searchItems(query);
      
      if (items.length === 0) {
        conversationState.delete(chatId);
        await sendTelegramMessage(chatId, `❌ <b>هیچ کاڵایەک نەدۆزرایەوە!</b>

گەڕان بۆ: "${query}"

🔄 بۆ دووبارە هەوڵدان: /delete`);
        return;
      }
      
      if (items.length === 1) {
        state.data.item = items[0];
        state.step = 2;
        conversationState.set(chatId, state);
        
        await sendTelegramMessage(chatId, `✅ <b>کاڵا دۆزرایەوە:</b>

📦 <b>${items[0].name}</b>
├ 🏷️ بارکۆد: <code>${items[0].barcode}</code>
├ 📊 بڕ: ${items[0].current_quantity} ${items[0].unit}
└ 📅 بەسەرچوون: ${items[0].exp_date || "نییە"}

⚠️ <b>ئایا دڵنیایت لە سڕینەوەی ئەم کاڵایە؟</b>

بنووسە <b>بەڵێ</b> بۆ سڕینەوە
بنووسە <b>نەخێر</b> بۆ هەڵوەشاندنەوە`);
      } else {
        state.data.searchResults = items;
        state.step = 1.5;
        conversationState.set(chatId, state);
        
        let response = `🔍 <b>چەندین کاڵا دۆزرایەوە:</b>\n\n`;
        items.forEach((item, index) => {
          response += `<b>${index + 1}.</b> ${item.name}\n   📊 ${item.current_quantity} ${item.unit}\n   🏷️ <code>${item.barcode}</code>\n\n`;
        });
        response += `<b>تکایە ژمارەی کاڵاکە بنووسە (1-${items.length}):</b>`;
        
        await sendTelegramMessage(chatId, response);
      }
      break;
      
    case 1.5:
      // User selecting from multiple items
      const selection = parseInt(text.trim());
      if (isNaN(selection) || selection < 1 || selection > state.data.searchResults.length) {
        await sendTelegramMessage(chatId, `❌ تکایە ژمارەیەک لە <b>1</b> تا <b>${state.data.searchResults.length}</b> بنووسە:`);
        return;
      }
      
      state.data.item = state.data.searchResults[selection - 1];
      delete state.data.searchResults;
      state.step = 2;
      conversationState.set(chatId, state);
      
      await sendTelegramMessage(chatId, `✅ <b>هەڵبژێردرا:</b>

📦 <b>${state.data.item.name}</b>
├ 🏷️ بارکۆد: <code>${state.data.item.barcode}</code>
├ 📊 بڕ: ${state.data.item.current_quantity} ${state.data.item.unit}
└ 📅 بەسەرچوون: ${state.data.item.exp_date || "نییە"}

⚠️ <b>ئایا دڵنیایت لە سڕینەوەی ئەم کاڵایە؟</b>

بنووسە <b>بەڵێ</b> بۆ سڕینەوە
بنووسە <b>نەخێر</b> بۆ هەڵوەشاندنەوە`);
      break;
      
    case 2:
      // Confirm delete
      const confirm = text.trim().toLowerCase();
      
      if (confirm === "نەخێر" || confirm === "no" || confirm === "نا") {
        conversationState.delete(chatId);
        await sendTelegramMessage(chatId, `✅ <b>سڕینەوە هەڵوەشایەوە.</b>

کاڵاکە نەسڕایەوە.`);
        return;
      }
      
      if (confirm !== "بەڵێ" && confirm !== "yes" && confirm !== "بەلێ") {
        await sendTelegramMessage(chatId, `❓ تکایە بنووسە:
        
<b>بەڵێ</b> - بۆ سڕینەوە
<b>نەخێر</b> - بۆ هەڵوەشاندنەوە`);
        return;
      }
      
      const result = await deleteItem(state.data.item.id);
      conversationState.delete(chatId);
      
      if (result.error) {
        await sendTelegramMessage(chatId, `❌ <b>هەڵە لە سڕینەوە!</b>

${result.error.message}

تکایە دووبارە هەوڵ بدەرەوە: /delete`);
        return;
      }
      
      await sendTelegramMessage(chatId, `🗑️ <b>کاڵا بە سەرکەوتوویی سڕایەوە!</b>

━━━━━━━━━━━━━━━━━━━━

📦 <b>${state.data.item.name}</b>
🏷️ بارکۆد: <code>${state.data.item.barcode}</code>

━━━━━━━━━━━━━━━━━━━━

📦 بۆ زیادکردنی کاڵای نوێ: /add`);
      break;
  }
}

// Handle /adjust command flow - conversational step by step
async function handleAdjustCommand(chatId: string, text: string, state: any) {
  const step = state?.step || 0;
  
  console.log(`handleAdjustCommand - chatId: ${chatId}, step: ${step}, text: ${text}`);
  
  switch (step) {
    case 0:
      // Start - ask for barcode or name
      conversationState.set(chatId, { command: "adjust", step: 1, data: {} });
      await sendTelegramMessage(chatId, `🔧 <b>ڕێکخستنی بڕی کاڵا</b>

ئەم فەرمانە بۆ ڕاستکردنەوەی هەڵەی بڕی کاڵایە.

<b>پرسیاری ١:</b> کام کاڵا دەتەوێت بڕەکەی ڕێک بخەیت؟

<i>تکایە بارکۆد یان ناوی کاڵاکە بنووسە:</i>
<i>🔙 بۆ هەڵوەشاندنەوە: /cancel</i>`);
      break;
      
    case 1:
      // Got search query - find item
      const query = text.trim();
      const items = await searchItems(query);
      
      if (items.length === 0) {
        conversationState.delete(chatId);
        await sendTelegramMessage(chatId, `❌ <b>هیچ کاڵایەک نەدۆزرایەوە!</b>

گەڕان بۆ: "${query}"

🔄 بۆ دووبارە هەوڵدان: /adjust`);
        return;
      }
      
      if (items.length === 1) {
        state.data.item = items[0];
        state.step = 2;
        conversationState.set(chatId, state);
        
        await sendTelegramMessage(chatId, `✅ <b>کاڵا دۆزرایەوە:</b>

📦 <b>${items[0].name}</b>
├ 🏷️ بارکۆد: <code>${items[0].barcode}</code>
└ 📊 بڕی ئێستا: <b>${items[0].current_quantity}</b> ${items[0].unit}

<b>پرسیاری ٢:</b> بڕی ڕاست چەندە؟

<i>تکایە ژمارەی ڕاستی بڕی کاڵاکە بنووسە:</i>`);
      } else {
        state.data.searchResults = items;
        state.step = 1.5;
        conversationState.set(chatId, state);
        
        let response = `🔍 <b>چەندین کاڵا دۆزرایەوە:</b>\n\n`;
        items.forEach((item, index) => {
          response += `<b>${index + 1}.</b> ${item.name}\n   📊 ${item.current_quantity} ${item.unit}\n   🏷️ <code>${item.barcode}</code>\n\n`;
        });
        response += `<b>تکایە ژمارەی کاڵاکە بنووسە (1-${items.length}):</b>`;
        
        await sendTelegramMessage(chatId, response);
      }
      break;
      
    case 1.5:
      // User selecting from multiple items
      const selection = parseInt(text.trim());
      if (isNaN(selection) || selection < 1 || selection > state.data.searchResults.length) {
        await sendTelegramMessage(chatId, `❌ تکایە ژمارەیەک لە <b>1</b> تا <b>${state.data.searchResults.length}</b> بنووسە:`);
        return;
      }
      
      state.data.item = state.data.searchResults[selection - 1];
      delete state.data.searchResults;
      state.step = 2;
      conversationState.set(chatId, state);
      
      await sendTelegramMessage(chatId, `✅ <b>هەڵبژێردرا:</b>

📦 <b>${state.data.item.name}</b>
└ 📊 بڕی ئێستا: <b>${state.data.item.current_quantity}</b> ${state.data.item.unit}

<b>پرسیاری ٢:</b> بڕی ڕاست چەندە؟

<i>تکایە ژمارەی ڕاستی بڕی کاڵاکە بنووسە:</i>`);
      break;
      
    case 2:
      // Got new quantity - ask for note
      const newQty = parseInt(text.trim());
      if (isNaN(newQty) || newQty < 0) {
        await sendTelegramMessage(chatId, `❌ تکایە ژمارەیەکی <b>ڕاست</b> بنووسە (سفر یان زیاتر):`);
        return;
      }
      
      state.data.newQuantity = newQty;
      state.step = 3;
      conversationState.set(chatId, state);
      
      const diff = newQty - state.data.item.current_quantity;
      const diffText = diff > 0 ? `+${diff}` : `${diff}`;
      
      await sendTelegramMessage(chatId, `✅ بڕی نوێ: <b>${newQty}</b> (${diffText})

<b>پرسیاری ٣:</b> هۆکاری ڕێکخستن چییە؟

<i>نموونە: هەڵەی ژمارە، کاڵای زیانمەند</i>
<i>ئەگەر تێبینی نییە بنووسە: <b>-</b></i>`);
      break;
      
    case 3:
      // Got note - create adjust movement
      const note = text.trim() === "-" ? "ڕێکخستنی بڕ" : text.trim();
      
      const movementData = {
        item_id: state.data.item.id,
        movement_type: "ADJUST",
        quantity: state.data.newQuantity,
        note: note,
        movement_date: new Date().toISOString().split("T")[0],
      };
      
      const mvResult = await addStockMovement(movementData);
      conversationState.delete(chatId);
      
      if (mvResult.error) {
        await sendTelegramMessage(chatId, `❌ <b>هەڵە لە ڕێکخستن!</b>

${mvResult.error.message}

تکایە دووبارە هەوڵ بدەرەوە: /adjust`);
        return;
      }
      
      const difference = state.data.newQuantity - state.data.item.current_quantity;
      const differenceText = difference > 0 ? `+${difference}` : `${difference}`;
      
      await sendTelegramMessage(chatId, `🎉 <b>بڕی کاڵا بە سەرکەوتوویی ڕێکخرا!</b>

━━━━━━━━━━━━━━━━━━━━

📦 <b>${state.data.item.name}</b>
├ 📊 بڕی پێشوو: ${state.data.item.current_quantity}
├ 📊 بڕی نوێ: <b>${state.data.newQuantity}</b>
├ 📈 جیاوازی: ${differenceText}
└ 📝 هۆکار: ${note}

━━━━━━━━━━━━━━━━━━━━

🔧 بۆ ڕێکخستنی زیاتر: /adjust`);
      break;
  }
}

// Handle incoming Telegram updates
async function handleUpdate(update: any) {
  const message = update.message;
  if (!message || !message.text) return;
  
  const chatId = message.chat.id.toString();
  const text = message.text.trim();
  const command = text.split(" ")[0].toLowerCase();
  const args = text.substring(command.length).trim();
  
  console.log(`Received: ${text} from chat: ${chatId}`);
  
  // Check for existing conversation state
  const state = conversationState.get(chatId);
  
  // Handle /cancel command
  if (command === "/cancel") {
    conversationState.delete(chatId);
    await sendTelegramMessage(chatId, `❌ <b>فەرمان هەڵوەشایەوە.</b>

بۆ دەستپێکردنەوە:
📦 /add - زیادکردنی کاڵا
📥 /stockin - داخڵکردن
📤 /stockout - دەرکردن`);
    return;
  }
  
  // If in a conversation, continue it
  if (state) {
    console.log(`Continuing conversation for ${chatId}, command: ${state.command}`);
    if (state.command === "add") {
      await handleAddCommand(chatId, text, state);
      return;
    } else if (state.command === "stockin") {
      await handleStockInCommand(chatId, text, state);
      return;
    } else if (state.command === "stockout") {
      await handleStockOutCommand(chatId, text, state);
      return;
    } else if (state.command === "edit") {
      await handleEditCommand(chatId, text, state);
      return;
    } else if (state.command === "delete") {
      await handleDeleteCommand(chatId, text, state);
      return;
    } else if (state.command === "adjust") {
      await handleAdjustCommand(chatId, text, state);
      return;
    }
  }
  
  try {
    switch (command) {
      case "/start":
        await saveChatId(chatId);
        await sendTelegramMessage(chatId, `👋 <b>بەخێربێیت بۆ بۆتی باکوری خۆشەویست!</b>

ئەم بۆتە یارمەتیت دەدات بۆ بەڕێوەبردنی کۆگاکەت.

<b>📦 بەڕێوەبردنی کاڵا:</b>
/add - زیادکردنی کاڵای نوێ
/edit - دەستکاری کاڵا
/delete - سڕینەوەی کاڵا
/search - گەڕان بۆ کاڵا

<b>📊 ستۆک:</b>
/stockin - داخڵکردنی ستۆک
/stockout - دەرکردنی ستۆک
/adjust - ڕێکخستنی بڕ

<b>📈 ئامار و ڕاپۆرت:</b>
/stats - ئامارەکانی کۆگا
/report - ڕاپۆرتی تەواو

<b>⚠️ ئاگاداریەکان:</b>
/expiring - نزیک لە بەسەرچوون
/expired - بەسەرچووەکان
/lowstock - کاڵا کەمبووەکان

<b>🔔 ئاگادارکردنەوە:</b>
/subscribe - چالاککردن
/unsubscribe - ناچالاککردن

/help - یارمەتی`);
        break;
        
      case "/help":
        await sendTelegramMessage(chatId, `📚 <b>لیستی فەرمانەکان:</b>

<b>📦 بەڕێوەبردنی کاڵا:</b>
/add - زیادکردنی کاڵای نوێ
/edit - دەستکاری کاڵا
/delete - سڕینەوەی کاڵا
/search [ناو/بارکۆد] - گەڕان بۆ کاڵا

<b>📊 ستۆک:</b>
/stockin - داخڵکردنی ستۆک
/stockout - دەرکردنی ستۆک
/adjust - ڕێکخستنی بڕ

<b>📈 ئامار و ڕاپۆرت:</b>
/stats - ئامارەکانی گشتی کۆگا
/report - ڕاپۆرتی تەواو

<b>⚠️ ئاگاداریەکان:</b>
/expiring - نزیک لە بەسەرچوون (٣٠ ڕۆژ)
/expired - بەسەرچووەکان
/lowstock - کەمبووەکان

<b>🔔 ئاگادارکردنەوە:</b>
/subscribe - چالاککردنی ڕۆژانە
/unsubscribe - ناچالاککردن

<b>🔙 هەڵوەشاندنەوە:</b>
/cancel - هەڵوەشاندنەوەی فەرمان`);
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
        
      case "/add":
        await handleAddCommand(chatId, text, null);
        break;
        
      case "/stockin":
        await handleStockInCommand(chatId, text, null);
        break;
        
      case "/stockout":
        await handleStockOutCommand(chatId, text, null);
        break;
        
      case "/edit":
        await handleEditCommand(chatId, text, null);
        break;
        
      case "/delete":
        await handleDeleteCommand(chatId, text, null);
        break;
        
      case "/adjust":
        await handleAdjustCommand(chatId, text, null);
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
            response += formatItem(item) + `\n⚠️ کەمترین: ${item.min_stock}\n\n`;
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

هەر ڕۆژێک کاتژمێر ٨:٠٠ی بەیانی ئاگادارت دەکەینەوە.`);
        break;
        
      case "/unsubscribe":
        await removeChatId(chatId);
        await sendTelegramMessage(chatId, "🔕 ئاگادارکردنەوەی ڕۆژانە ناچالاک کرا.");
        break;
        
      default:
        // Check if we're in a conversation
        if (state) {
          console.log(`Unknown command but in conversation state`);
        } else {
          await sendTelegramMessage(chatId, `❓ <b>فەرمانی نەناسراو!</b>

بنووسە /help بۆ بینینی فەرمانەکان.`);
        }
    }
  } catch (error) {
    console.error("Error handling update:", error);
    await sendTelegramMessage(chatId, `❌ <b>هەڵەیەک ڕوویدا!</b>

تکایە دووبارە هەوڵ بدەرەوە.
/help - بۆ یارمەتی`);
  }
}

// Save chat ID for notifications
async function saveChatId(chatId: string) {
  console.log(`Saving chat ID: ${chatId}`);
  
  const { error } = await supabase
    .from("telegram_subscribers")
    .upsert({ chat_id: chatId }, { onConflict: "chat_id" });
  
  if (error) {
    console.error("Error saving chat ID:", error);
  }
}

// Remove chat ID from notifications
async function removeChatId(chatId: string) {
  console.log(`Removing chat ID: ${chatId}`);
  
  const { error } = await supabase
    .from("telegram_subscribers")
    .delete()
    .eq("chat_id", chatId);
  
  if (error) {
    console.error("Error removing chat ID:", error);
  }
}

// Send daily notifications to all subscribers
async function sendDailyNotifications() {
  console.log("Starting daily notifications...");
  
  const { data: subscribers, error } = await supabase
    .from("telegram_subscribers")
    .select("chat_id");
  
  if (error) {
    console.error("Error fetching subscribers:", error);
    return { success: false, error: error.message };
  }
  
  const notification = await generateDailyNotification();
  
  if (!notification) {
    console.log("No alerts to send today");
    return { success: true, message: "No alerts to send" };
  }
  
  console.log(`Sending notifications to ${subscribers?.length || 0} subscribers`);
  
  let sentCount = 0;
  for (const subscriber of subscribers || []) {
    try {
      await sendTelegramMessage(subscriber.chat_id, notification);
      sentCount++;
    } catch (err) {
      console.error(`Failed to send to ${subscriber.chat_id}:`, err);
    }
  }
  
  return { success: true, sentCount };
}

serve(async (req) => {
  console.log(`Received ${req.method} request`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const body = await req.json();
    console.log("Received Telegram update:", JSON.stringify(body));
    
    // Check if this is a cron job request for daily notifications
    if (body.action === "daily-notify") {
      const result = await sendDailyNotifications();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Handle regular Telegram updates
    await handleUpdate(body);
    
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error processing request:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
