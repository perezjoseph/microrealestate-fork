# MicroRealEstate Balance Information

## Current Status

✅ **WhatsApp Amount Issue RESOLVED**: The "DOP undefined" issue has been fixed. WhatsApp messages now show correct amounts like "DOP 200.00".

## Balance Fields in Rent System

Based on the rent management system analysis, here are the key balance-related fields:

### 📊 **Rent Object Fields**

| Field | Description | Example | Usage |
|-------|-------------|---------|--------|
| `totalAmount` | Total amount due for the period | `1500.00` | Base rent calculation |
| `totalToPay` | Amount tenant needs to pay | `1500.00` | What tenant owes |
| `payment` | Amount already paid | `500.00` | Payments received |
| `newBalance` | Current balance (negative = owed) | `-1000.00` | Outstanding amount |
| `balance` | Previous balance | `0.00` | Carried over amount |

### 🔍 **Balance Calculation Logic**

From the rent manager code:
```javascript
// Payment status determination
if (rent.totalAmount <= 0 || rent.newBalance >= 0) {
  // Rent is PAID
} else if (rent.payment > 0) {
  // Rent is PARTIALLY PAID
} else {
  // Rent is NOT PAID
}
```

### 💰 **Balance Interpretation**

- **`newBalance >= 0`**: Tenant has paid in full or overpaid
- **`newBalance < 0`**: Tenant owes money (amount = absolute value of newBalance)
- **`payment > 0`**: Some payment has been made
- **`payment = 0`**: No payment received

## WhatsApp Template Amount Selection

### Current Implementation
The WhatsApp system now tries multiple fields in this order:
1. `totalWithVAT` (legacy field)
2. `total` (legacy field)  
3. `totalAmount` ✅ (likely the correct field)
4. `totalToPay` ✅ (also likely correct)

### Recommended Amount Field

Based on the rent system analysis, **`totalToPay`** is probably the most appropriate field for WhatsApp invoices because:
- It represents what the tenant actually needs to pay
- It accounts for any adjustments, discounts, or previous payments
- It's the "actionable" amount for the tenant

## Balance Display Options

### Option 1: Show Total Amount Due
```javascript
const finalAmount = rent.totalToPay || rent.totalAmount || '0.00';
```
**Message**: "Monto total a pagar: RD$ 1,500.00"

### Option 2: Show Outstanding Balance
```javascript
const finalAmount = Math.abs(rent.newBalance) || rent.totalToPay || '0.00';
```
**Message**: "Saldo pendiente: RD$ 1,000.00"

### Option 3: Show Both (Enhanced Template)
```javascript
const totalDue = rent.totalToPay || rent.totalAmount || '0.00';
const outstanding = rent.newBalance < 0 ? Math.abs(rent.newBalance) : '0.00';
```
**Message**: 
```
💰 Monto total: RD$ 1,500.00
💳 Pagado: RD$ 500.00
⚠️ Saldo pendiente: RD$ 1,000.00
```

## Current WhatsApp Template Structure

The factura2 template currently uses 5 parameters:
1. **{{1}}** - Tenant name
2. **{{2}}** - Invoice period  
3. **{{3}}** - Amount (currently using totalAmount/totalToPay)
4. **{{4}}** - Due date
5. **{{5}}** - Invoice URL

## Debugging Balance Information

### Check Browser Console
When sending WhatsApp messages, look for logs like:
```javascript
🔍 WhatsApp Amount Debug: {
  tenantName: "John Doe",
  totalAmount: 1500,      // Base amount
  totalToPay: 1500,       // Amount to pay
  payment: 500,           // Amount paid
  newBalance: -1000,      // Outstanding (negative = owed)
  balance: 0,             // Previous balance
  finalAmount: 1500       // Amount used in message
}
```

### Check WhatsApp Service Logs
```bash
docker compose logs whatsapp --tail=10
```

Look for:
```
📋 Template parameters: John Doe, Enero 2025, RD$ 1500.00, 31/01/2025, https://...
```

## Recommendations

### 1. Verify Current Amount Field
Check the debugging logs to see which field contains the correct amount:
- Open browser console
- Send a WhatsApp message
- Look at the debugging output

### 2. Consider Balance Context
Decide what amount is most useful for tenants:
- **Total due**: Full amount for the period
- **Outstanding**: What they still owe after payments
- **Both**: Complete payment picture

### 3. Enhanced Template (Optional)
Consider creating a more detailed template that shows:
- Total amount due
- Amount paid
- Outstanding balance
- Payment deadline

## Current Status Summary

✅ **Fixed**: WhatsApp no longer shows "undefined"
✅ **Working**: Shows actual amounts (e.g., "DOP 200.00")
✅ **Template**: Using "factura2" correctly
✅ **Debugging**: Comprehensive logging available
🔍 **Next**: Verify correct amount field from debugging logs

---

**Last Updated**: January 21, 2025
**Status**: Amount issue resolved, balance information documented
