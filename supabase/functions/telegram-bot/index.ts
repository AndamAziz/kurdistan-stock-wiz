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
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

// Handle /add command flow
async function handleAddCommand(chatId: string, text: string, state: any) {
  const step = state?.step || 0;
  
  switch (step) {
    case 0:
      // Start - ask for item name
      conversationState.set(chatId, { command: "add", step: 1, data: {} });
      await sendTelegramMessage(chatId, `📦 <b>زیادکردنی کاڵای نوێ</b>

تکایە <b>ناوی کاڵا</b> بنووسە:

<i>بۆ هەڵوەشاندنەوە: /cancel</i>`);
      break;
      
    case 1:
      // Got name - ask for barcode
      state.data.name = text.trim();
      state.step = 2;
      conversationState.set(chatId, state);
      await sendTelegramMessage(chatId, `✅ ناو: <b>${state.data.name}</b>

تکایە <b>بارکۆد</b> بنووسە:`);
      break;
      
    case 2:
      // Got barcode - check if exists, ask for quantity
      const barcode = text.trim();
      const existingItem = await getItemByBarcode(barcode);
      
      if (existingItem) {
        conversationState.delete(chatId);
        await sendTelegramMessage(chatId, `❌ ئەم بارکۆدە پێشتر هەیە!

📦 ${existingItem.name}
بڕی ئێستا: ${existingItem.current_quantity}

تکایە بارکۆدێکی جیاواز بەکاربهێنە یان /stockin بەکاربهێنە.`);
        return;
      }
      
      state.data.barcode = barcode;
      state.step = 3;
      conversationState.set(chatId, state);
      await sendTelegramMessage(chatId, `✅ بارکۆد: <code>${barcode}</code>

تکایە <b>بڕی سەرەتایی</b> بنووسە (ژمارە):`);
      break;
      
    case 3:
      // Got quantity - ask for unit
      const qty = parseInt(text.trim());
      if (isNaN(qty) || qty < 0) {
        await sendTelegramMessage(chatId, "❌ تکایە ژمارەیەکی ڕاست بنووسە:");
        return;
      }
      
      state.data.current_quantity = qty;
      state.step = 4;
      conversationState.set(chatId, state);
      
      await sendTelegramMessage(chatId, `✅ بڕ: <b>${qty}</b>

تکایە <b>یەکە</b> بنووسە:
<i>نموونە: دانە، کارتۆن، کیلۆ، پاکێت</i>`);
      break;
      
    case 4:
      // Got unit - ask for expiry date
      state.data.unit = text.trim() || "دانە";
      state.step = 5;
      conversationState.set(chatId, state);
      
      await sendTelegramMessage(chatId, `✅ یەکە: <b>${state.data.unit}</b>

تکایە <b>بەرواری بەسەرچوون</b> بنووسە:
<i>فۆرمات: YYYY-MM-DD یان DD/MM/YYYY</i>
<i>بۆ نموونە: 2025-12-31 یان 31/12/2025</i>

یان بنووسە <b>نییە</b> ئەگەر بەسەرچوون نییە:`);
      break;
      
    case 5:
      // Got expiry - confirm and save
      const expInput = text.trim().toLowerCase();
      
      if (expInput !== "نییە" && expInput !== "no" && expInput !== "-") {
        const expDate = parseDate(text.trim());
        if (!expDate) {
          await sendTelegramMessage(chatId, "❌ فۆرماتی بەروار هەڵەیە. تکایە دووبارە بنووسە:\n<i>YYYY-MM-DD یان DD/MM/YYYY</i>");
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
        await sendTelegramMessage(chatId, `❌ هەڵە لە زیادکردن: ${result.error.message}`);
        return;
      }
      
      await sendTelegramMessage(chatId, `✅ <b>کاڵا بە سەرکەوتوویی زیادکرا!</b>

📦 <b>${itemData.name}</b>
├ بارکۆد: <code>${itemData.barcode}</code>
├ بڕ: ${itemData.current_quantity} ${itemData.unit}
└ بەسەرچوون: ${itemData.exp_date || "نییە"}`);
      break;
  }
}

// Handle /stockin command flow
async function handleStockInCommand(chatId: string, text: string, state: any) {
  const step = state?.step || 0;
  
  switch (step) {
    case 0:
      // Start - ask for barcode
      conversationState.set(chatId, { command: "stockin", step: 1, data: {} });
      await sendTelegramMessage(chatId, `📥 <b>داخڵکردنی ستۆک</b>

تکایە <b>بارکۆد یان ناوی کاڵا</b> بنووسە:

<i>بۆ هەڵوەشاندنەوە: /cancel</i>`);
      break;
      
    case 1:
      // Got search query - find item
      const query = text.trim();
      const items = await searchItems(query);
      
      if (items.length === 0) {
        await sendTelegramMessage(chatId, `❌ هیچ کاڵایەک نەدۆزرایەوە بۆ: "${query}"

تکایە دووبارە هەوڵ بدەرەوە یان /add بەکاربهێنە بۆ کاڵای نوێ.`);
        conversationState.delete(chatId);
        return;
      }
      
      if (items.length === 1) {
        // Found exactly one item
        state.data.item = items[0];
        state.step = 2;
        conversationState.set(chatId, state);
        
        await sendTelegramMessage(chatId, `✅ کاڵا دۆزرایەوە:

📦 <b>${items[0].name}</b>
├ بارکۆد: <code>${items[0].barcode}</code>
└ بڕی ئێستا: ${items[0].current_quantity} ${items[0].unit}

تکایە <b>بڕی داخڵکردن</b> بنووسە:`);
      } else {
        // Multiple items found - let user choose
        state.data.searchResults = items;
        state.step = 1.5;
        conversationState.set(chatId, state);
        
        let response = `🔍 چەندین کاڵا دۆزرایەوە:\n\n`;
        items.forEach((item, index) => {
          response += `<b>${index + 1}.</b> ${item.name} (${item.current_quantity} ${item.unit})\n   بارکۆد: <code>${item.barcode}</code>\n\n`;
        });
        response += `تکایە ژمارەی کاڵاکە بنووسە (1-${items.length}):`;
        
        await sendTelegramMessage(chatId, response);
      }
      break;
      
    case 1.5:
      // User selecting from multiple items
      const selection = parseInt(text.trim());
      if (isNaN(selection) || selection < 1 || selection > state.data.searchResults.length) {
        await sendTelegramMessage(chatId, `❌ تکایە ژمارەیەک لە 1 تا ${state.data.searchResults.length} بنووسە:`);
        return;
      }
      
      state.data.item = state.data.searchResults[selection - 1];
      delete state.data.searchResults;
      state.step = 2;
      conversationState.set(chatId, state);
      
      await sendTelegramMessage(chatId, `✅ هەڵبژێردرا:

📦 <b>${state.data.item.name}</b>
└ بڕی ئێستا: ${state.data.item.current_quantity} ${state.data.item.unit}

تکایە <b>بڕی داخڵکردن</b> بنووسە:`);
      break;
      
    case 2:
      // Got quantity - ask for note
      const inQty = parseInt(text.trim());
      if (isNaN(inQty) || inQty <= 0) {
        await sendTelegramMessage(chatId, "❌ تکایە ژمارەیەکی گەورەتر لە سفر بنووسە:");
        return;
      }
      
      state.data.quantity = inQty;
      state.step = 3;
      conversationState.set(chatId, state);
      
      await sendTelegramMessage(chatId, `✅ بڕ: <b>${inQty}</b>

تکایە <b>تێبینی</b> بنووسە (ئارەزوومەندانە):
<i>نموونە: کڕین لە کۆمپانیای X</i>

یان بنووسە <b>-</b> بۆ بەبێ تێبینی:`);
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
        await sendTelegramMessage(chatId, `❌ هەڵە: ${mvResult.error.message}`);
        return;
      }
      
      const newQty = state.data.item.current_quantity + state.data.quantity;
      
      await sendTelegramMessage(chatId, `✅ <b>داخڵکردن تۆمارکرا!</b>

📦 <b>${state.data.item.name}</b>
├ داخڵکراو: +${state.data.quantity} ${state.data.item.unit}
├ بڕی پێشوو: ${state.data.item.current_quantity}
├ بڕی نوێ: <b>${newQty}</b>
└ تێبینی: ${note || "-"}`);
      break;
  }
}

// Handle /stockout command flow
async function handleStockOutCommand(chatId: string, text: string, state: any) {
  const step = state?.step || 0;
  
  switch (step) {
    case 0:
      // Start - ask for barcode
      conversationState.set(chatId, { command: "stockout", step: 1, data: {} });
      await sendTelegramMessage(chatId, `📤 <b>دەرکردنی ستۆک</b>

تکایە <b>بارکۆد یان ناوی کاڵا</b> بنووسە:

<i>بۆ هەڵوەشاندنەوە: /cancel</i>`);
      break;
      
    case 1:
      // Got search query - find item
      const query = text.trim();
      const items = await searchItems(query);
      
      if (items.length === 0) {
        await sendTelegramMessage(chatId, `❌ هیچ کاڵایەک نەدۆزرایەوە بۆ: "${query}"`);
        conversationState.delete(chatId);
        return;
      }
      
      if (items.length === 1) {
        if (items[0].current_quantity <= 0) {
          await sendTelegramMessage(chatId, `❌ ئەم کاڵایە بڕی نییە!

📦 ${items[0].name}
بڕی ئێستا: 0`);
          conversationState.delete(chatId);
          return;
        }
        
        state.data.item = items[0];
        state.step = 2;
        conversationState.set(chatId, state);
        
        await sendTelegramMessage(chatId, `✅ کاڵا دۆزرایەوە:

📦 <b>${items[0].name}</b>
├ بارکۆد: <code>${items[0].barcode}</code>
└ بڕی بەردەست: <b>${items[0].current_quantity}</b> ${items[0].unit}

تکایە <b>بڕی دەرکردن</b> بنووسە:`);
      } else {
        state.data.searchResults = items;
        state.step = 1.5;
        conversationState.set(chatId, state);
        
        let response = `🔍 چەندین کاڵا دۆزرایەوە:\n\n`;
        items.forEach((item, index) => {
          response += `<b>${index + 1}.</b> ${item.name} (${item.current_quantity} ${item.unit})\n   بارکۆد: <code>${item.barcode}</code>\n\n`;
        });
        response += `تکایە ژمارەی کاڵاکە بنووسە (1-${items.length}):`;
        
        await sendTelegramMessage(chatId, response);
      }
      break;
      
    case 1.5:
      // User selecting from multiple items
      const selection = parseInt(text.trim());
      if (isNaN(selection) || selection < 1 || selection > state.data.searchResults.length) {
        await sendTelegramMessage(chatId, `❌ تکایە ژمارەیەک لە 1 تا ${state.data.searchResults.length} بنووسە:`);
        return;
      }
      
      const selectedItem = state.data.searchResults[selection - 1];
      if (selectedItem.current_quantity <= 0) {
        await sendTelegramMessage(chatId, `❌ ئەم کاڵایە بڕی نییە!`);
        conversationState.delete(chatId);
        return;
      }
      
      state.data.item = selectedItem;
      delete state.data.searchResults;
      state.step = 2;
      conversationState.set(chatId, state);
      
      await sendTelegramMessage(chatId, `✅ هەڵبژێردرا:

📦 <b>${state.data.item.name}</b>
└ بڕی بەردەست: <b>${state.data.item.current_quantity}</b> ${state.data.item.unit}

تکایە <b>بڕی دەرکردن</b> بنووسە:`);
      break;
      
    case 2:
      // Got quantity - validate and ask for note
      const outQty = parseInt(text.trim());
      if (isNaN(outQty) || outQty <= 0) {
        await sendTelegramMessage(chatId, "❌ تکایە ژمارەیەکی گەورەتر لە سفر بنووسە:");
        return;
      }
      
      if (outQty > state.data.item.current_quantity) {
        await sendTelegramMessage(chatId, `❌ بڕی داواکراو زیاترە لە بڕی بەردەست!

بڕی بەردەست: ${state.data.item.current_quantity} ${state.data.item.unit}
تکایە بڕێکی کەمتر بنووسە:`);
        return;
      }
      
      state.data.quantity = outQty;
      state.step = 3;
      conversationState.set(chatId, state);
      
      await sendTelegramMessage(chatId, `✅ بڕ: <b>${outQty}</b>

تکایە <b>تێبینی</b> بنووسە (ئارەزوومەندانە):
<i>نموونە: فرۆشتن بە کڕیاری X</i>

یان بنووسە <b>-</b> بۆ بەبێ تێبینی:`);
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
        await sendTelegramMessage(chatId, `❌ هەڵە: ${mvResult.error.message}`);
        return;
      }
      
      const newQty = state.data.item.current_quantity - state.data.quantity;
      
      await sendTelegramMessage(chatId, `✅ <b>دەرکردن تۆمارکرا!</b>

📦 <b>${state.data.item.name}</b>
├ دەرکراو: -${state.data.quantity} ${state.data.item.unit}
├ بڕی پێشوو: ${state.data.item.current_quantity}
├ بڕی نوێ: <b>${newQty}</b>
└ تێبینی: ${note || "-"}`);
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
    await sendTelegramMessage(chatId, "❌ فەرمان هەڵوەشایەوە.");
    return;
  }
  
  // If in a conversation, continue it
  if (state) {
    if (state.command === "add") {
      await handleAddCommand(chatId, text, state);
      return;
    } else if (state.command === "stockin") {
      await handleStockInCommand(chatId, text, state);
      return;
    } else if (state.command === "stockout") {
      await handleStockOutCommand(chatId, text, state);
      return;
    }
  }
  
  try {
    switch (command) {
      case "/start":
        await saveChatId(chatId);
        await sendTelegramMessage(chatId, `👋 <b>بەخێربێیت بۆ بۆتی باکوری خۆشەویست!</b>

ئەم بۆتە یارمەتیت دەدات بۆ بەڕێوەبردنی کۆگاکەت.

<b>فەرمانەکان:</b>
📊 /stats - ئامارەکانی کۆگا
📋 /report - ڕاپۆرتی تەواو

📦 /add - زیادکردنی کاڵای نوێ
📥 /stockin - داخڵکردنی ستۆک
📤 /stockout - دەرکردنی ستۆک

⏰ /expiring - کاڵا نزیک لە بەسەرچوون
❌ /expired - کاڵا بەسەرچووەکان
⚠️ /lowstock - کاڵا کەمبووەکان
🔍 /search - گەڕان بۆ کاڵا

🔔 /subscribe - چالاککردنی ئاگادارکردنەوە
🔕 /unsubscribe - ناچالاککردنی ئاگادارکردنەوە
❓ /help - یارمەتی

🔔 ئاگادارکردنەوەی ڕۆژانە چالاک کرا!`);
        break;
        
      case "/help":
        await sendTelegramMessage(chatId, `📚 <b>لیستی فەرمانەکان:</b>

<b>📊 ئامار و ڕاپۆرت:</b>
/stats - ئامارەکانی گشتی کۆگا
/report - ڕاپۆرتی تەواو

<b>📦 بەڕێوەبردنی کاڵا:</b>
/add - زیادکردنی کاڵای نوێ
/stockin - داخڵکردنی ستۆک (کڕین)
/stockout - دەرکردنی ستۆک (فرۆشتن)
/search [ناو/بارکۆد] - گەڕان بۆ کاڵا

<b>⚠️ ئاگاداریەکان:</b>
/expiring - نزیک لە بەسەرچوون (٣٠ ڕۆژ)
/expired - بەسەرچووەکان
/lowstock - کەمبووەکان

<b>🔔 ئاگادارکردنەوە:</b>
/subscribe - چالاککردنی ڕۆژانە
/unsubscribe - ناچالاککردن

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
        await sendTelegramMessage(chatId, `❓ فەرمانی نەناسراو. بنووسە /help بۆ بینینی فەرمانەکان.`);
    }
  } catch (error) {
    console.error("Error handling update:", error);
    await sendTelegramMessage(chatId, "❌ هەڵەیەک ڕوویدا. تکایە دووبارە هەوڵ بدەرەوە.");
  }
}

// Save chat ID for notifications
async function saveChatId(chatId: string) {
  console.log(`Saving chat ID: ${chatId}`);
  
  const { error } = await supabase
    .from("telegram_subscribers")
    .upsert({ chat_id: chatId }, { onConflict: "chat_id" });
  
  if (error) {
    console.log("Note: telegram_subscribers error:", error.message);
  }
}

// Remove chat ID from notifications
async function removeChatId(chatId: string) {
  const { error } = await supabase
    .from("telegram_subscribers")
    .delete()
    .eq("chat_id", chatId);
  
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Daily notification endpoint
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
