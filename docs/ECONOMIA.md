# 📊 Sistema de Economia

## Princípios Fundamentais

1. **Produção Balanceada**: Todos os recursos têm limites de produção
2. **Sink de Moeda**: Sistemas que removem moeda da economia
3. **Validação Server-Side**: Todo cálculo é feito no servidor
4. **Auditoria Completa**: Todas as transações são registradas

## Recursos Principais

### 1. Materias Primas
- **Farming**: Alimentos, sementes
- **Mining**: Minério, pedra, ouro
- **Hunting**: Couro, osso, carne
- **Crafting**: Itens processados

### 2. Armas & Equipamento
- Diferentes raridades (Common → Legendary)
- Requerem múltiplas materias primas
- Durabilidade/quebra (sink de moeda)
- Melhorias (upgrade system)

### 3. Moeda Virtual vs Real

**Moeda Virtual (Coins)**:
- Obtida por: farming, mining, hunting, vendas no mercado
- Usada em: crafting, mercado, melhorias
- Taxa de produção controlada

**Dinheiro Real**:
- Conversão 1000 coins = $0.01 USD (configurável)
- Saques manuais com aprovação
- Validações KYC para valores altos

## Anti-Exploração

### Validações

```sql
-- Verificar duplicação de transações (mesma quantidade, item, tempo curto)
SELECT * FROM transactions 
WHERE user_id = $1 
AND item_name = $2 
AND transaction_date > NOW() - INTERVAL '5 seconds'
HAVING COUNT(*) > 1;

-- Limitar produção por hora
SELECT SUM(quantity) FROM inventory
WHERE user_id = $1
AND item_name = 'farming_output'
AND created_at > NOW() - INTERVAL '1 hour';
```

### Rate Limiting

- Crafting: 1 item a cada X segundos (baseado na complexidade)
- Vendas: Máximo X transações por hora
- Conversão Real Money: 1 solicitação a cada 24 horas

## Equilibrio de Preços

### Tabela de Preços Base

| Item | Base Price | Rarity | Farming Rate |
|------|-----------|--------|---------------|
| Trigo | 1 coin | Common | 10/hora |
| Minério | 5 coins | Uncommon | 3/hora |
| Ouro | 50 coins | Rare | 0.5/hora |
| Pele de Dragon | 500 coins | Epic | 0.1/hora |

### Ajustes Dinâmicos

```javascript
// Algoritmo de preço baseado em oferta/demanda
const price = basePrice * (demanda / oferta) * inflationFactor;
```

## Sinks de Moeda

1. **Durabilidade**: -1% de valor por quebra
2. **Melhorias**: Custo exponencial
3. **Taxas**: 5% de taxa em transações
4. **Consumíveis**: Uso permanente