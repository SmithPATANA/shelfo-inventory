export const smartPrompt = (rawText: string) => `
You are a product inventory parser. Extract the following fields from the OCR text:

- name: the product name
- type: the product category (e.g. "ladies suits")
- quantity: number of items
- purchase_price: how much it was bought for
- selling_price: how much to sell it
- supplier: supplier name
- notes: any extra info
- weight: e.g. "2kg" (if present, else null)
- size: e.g. "M", "42", "100x200cm" (if present, else null)

Return only valid JSON, no explanations, in this exact format:
{
  "name": "",
  "type": "",
  "quantity": 0,
  "purchase_price": 0,
  "selling_price": 0,
  "supplier": "",
  "notes": "",
  "weight": "",
  "size": ""
}

Extract the details from this text:
"""
${rawText}
"""
`; 