const data = await response.json();
console.log('Anthropic response:', JSON.stringify(data));
return res.status(200).json(data);
