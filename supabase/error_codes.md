# Error Codes Convention

All custom RPC errors use **`ERRCODE = 'P0001'`** (raise_exception) with a specific **`DETAIL`** for mapping.

## Error Codes Reference

| DETAIL Code                  | French Message                                            | Context                   |
|------------------------------|-----------------------------------------------------------|---------------------------|
| `invalid_token`              | Lien d'invitation invalide                                | accept_invite             |
| `expired_token`              | Cette invitation a expiré                                 | accept_invite             |
| `already_consumed`           | Cette invitation a déjà été utilisée                      | accept_invite             |
| `already_member`             | Vous êtes déjà membre de ce groupe                        | accept_invite             |
| `not_member`                 | Vous n'êtes pas membre de ce groupe                       | get_group_members, etc.   |
| `expense_currency_mismatch`  | La devise de la dépense doit correspondre à celle du groupe | enforce_group_currency   |

## SQL Convention

```sql
RAISE EXCEPTION '<error_name>'
  USING ERRCODE = 'P0001',
        DETAIL = '<error_code>';
```

## TypeScript Mapping

```typescript
// src/lib/supabase/errors.ts
if (code === "P0001" && err.details) {
  switch (err.details) {
    case "invalid_token": return "Lien d'invitation invalide";
    // ...
  }
}
```

## PostgreSQL Native Errors

| Code     | Meaning                  | French Message                                    |
|----------|--------------------------|---------------------------------------------------|
| `23503`  | Foreign key violation    | Cette opération violerait l'intégrité des données |
| `23505`  | Unique violation         | Cet enregistrement existe déjà                     |
| `PGRST116` | PostgREST bad request  | Requête invalide. Veuillez vérifier vos données.  |
