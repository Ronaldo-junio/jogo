# 🔒 Sistema de Segurança

## Princípios

1. **Server-Side Validation**: NUNCA confiar no cliente
2. **Auditoria Completa**: Log de todas as operações
3. **Rate Limiting**: Prevenir exploração
4. **Detecção de Anomalias**: IA para detectar comportamento suspeito

## Anti-Cheat

### Validações de Transação

```javascript
async function validateTransaction(buyerId, sellerId, itemName, quantity, price) {
  // 1. Verificar se buyer tem saldo
  const buyer = await pool.query(
    'SELECT virtual_coins FROM wallet WHERE user_id = $1',
    [buyerId]
  );
  
  const totalCost = quantity * price;
  if (buyer.rows[0].virtual_coins < totalCost) {
    throw new Error('Insufficient funds');
  }

  // 2. Verificar se seller tem o item
  const seller = await pool.query(
    'SELECT quantity FROM inventory WHERE user_id = $1 AND item_name = $2',
    [sellerId, itemName]
  );
  
  if (!seller.rows[0] || seller.rows[0].quantity < quantity) {
    throw new Error('Seller does not have enough items');
  }

  // 3. Verificar duplicação (mesma transação duplicada em < 5s)
  const duplicate = await pool.query(
    `SELECT id FROM transactions 
     WHERE buyer_id = $1 AND seller_id = $2 
     AND item_name = $3 AND quantity = $4
     AND transaction_date > NOW() - INTERVAL '5 seconds'`,
    [buyerId, sellerId, itemName, quantity]
  );
  
  if (duplicate.rows.length > 0) {
    throw new Error('Duplicate transaction detected');
  }

  // 4. Verificar velocidade anormal
  const recentTransactions = await pool.query(
    `SELECT COUNT(*) FROM transactions 
     WHERE buyer_id = $1 
     AND transaction_date > NOW() - INTERVAL '1 hour'`,
    [buyerId]
  );
  
  if (recentTransactions.rows[0].count > 100) {
    // Ativar investigação manual
    await flagAccount(buyerId, 'UNUSUAL_ACTIVITY');
  }

  return true;
}
```

### Limites de Taxa

```javascript
const RATE_LIMITS = {
  CRAFTING: {
    requests: 10,
    window: 3600000, // 1 hora
  },
  MARKET_BUY: {
    requests: 50,
    window: 3600000,
  },
  REAL_MONEY_CONVERSION: {
    requests: 1,
    window: 86400000, // 24 horas
  }
};
```

## Autenticação

### JWT Tokens

```javascript
const token = jwt.sign(
  { userId, username, role: 'player' },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

### Verificação de Sessão

- Token renovação automática a cada 12 horas
- Logout automático após 72 horas inativo
- Detecção de IP múltiplo (possível compartilhamento)

## Logs de Auditoria

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100),
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Detecção de Anomalias

### Sinais de Alerta

1. **Velocidade Anormal**: > 100 transações/hora
2. **Padrão Estranho**: Comprar para vender imediatamente com loss
3. **Exploração de Bugs**: Mesma ação que foi fixada
4. **RMT Suspeito**: Conversão imediata para real money

### Ações Automáticas

- **Nível 1**: Alertar administrador
- **Nível 2**: Congelar conversão real money
- **Nível 3**: Ban temporário (24-48h)
- **Nível 4**: Ban permanente + investigação

## Segurança de Moeda Real

### Validações

1. **KYC**: Conhecer seu cliente para conversões > $50/mês
2. **Stripe/PayPal**: Usar gateway confiável
3. **Taxa de Conversão**: Fixa e auditável
4. **Limite Diário**: $100/dia por usuário
5. **Limite Mensal**: $500/mês por usuário

### Processo de Saque

```
1. Usuário solicita conversão
2. Validar: saldo, limite, KYC
3. Sistema coloca em fila (aprovação manual)
4. Admin aprova/rejeita
5. Processar via Stripe
6. Notificar usuário
7. Registrar em auditoria
```