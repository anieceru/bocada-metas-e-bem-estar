<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->
## Bocada

- Health fields on `profiles` are nulled by a DB trigger whenever `consentimento_saude_em` is null, and `metas` writes require consent via RLS — never rely on the client alone to enforce consent.
- Goal "out of usual range" thresholds and the consent text version live in `src/lib/config.ts`, the single place to adjust them.
- Account deletion runs in a server function using the admin client after `requireSupabaseAuth`; user id comes only from the verified session.
- Keep USDA branded foods in a separate local catalog and reference its FDC ids separately from TACO ids in diary entries, so existing entries and source attribution remain intact. Never turn missing USDA nutrients into zero.
- Resolve diary phrases and rank catalog candidates through browser-safe local helpers; query common foods first, cache searches per composer, and require explicit confirmation for missing brands to avoid misattribution and unnecessary catalog waits.
- Use the shared private-page metadata helper for authenticated content pages to keep page-specific social descriptions static and free of user health data.
- Keep macro energy conversions and save validation in src/lib/macros.ts; persist whole grams rounded down when converting percentages so rounding cannot exceed the calorie budget.
- Store meal labels on each diary entry and user-editable meal lists on profiles; removing a category must not remove existing food records.
- Monthly evolution uses recorded nutrition totals only; missing days and unavailable micronutrients must not be reported as zero intake or inferred body-weight change.
- Push delivery uses the Firebase Messaging connector and a dedicated messaging worker; send generic reminders only, never nutrient totals, body metrics, or custom meal labels to delivery services.
- Notification scheduling runs hourly in the user's stored timezone; daily-only mode suppresses meal, water, and goal-alert pushes, and a sent-key prevents repeated alerts within one day.
