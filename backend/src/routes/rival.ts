import { Router, Request, Response } from 'express';
import { isDemoMode, supabase } from '../lib/supabase.js';
import { authMiddleware, AuthPayload } from '../middleware/auth.js';
import {
  getRivalBattleState,
  processRivalCounterAttack,
  dealHouseholdDamage,
  isFridayBattleActive,
  resetWeeklyBattle,
} from '../lib/rivalAI.js';

const router = Router();
router.use(authMiddleware);

let demoBattle: {
  active: boolean;
  battle?: Record<string, unknown>;
  rival?: Record<string, unknown>;
  logs?: Array<Record<string, unknown>>;
} = { active: false };

router.get('/state', async (_req: Request, res: Response) => {
  if (isDemoMode || !supabase) {
    if (isFridayBattleActive()) {
      demoBattle = {
        active: true,
        battle: {
          rival_name: 'The Citadel Remnant',
          rival_commander: 'Colonel Autumn',
          rival_hp_max: 100,
          rival_hp_current: 75,
          household_hp_max: 80,
          household_hp_current: 60,
          outcome: 'active',
        },
        rival: { name: 'The Citadel Remnant', commander: 'Colonel Autumn', vibe: 'enclave' },
        logs: [
          { message: 'Colonel Autumn declares war on your household!', actor: 'system', damage: 0 },
          { message: 'Power Armor squad breaches the perimeter.', actor: 'rival', damage: 5 },
        ],
      };
    } else {
      demoBattle = { active: false };
    }
    return res.json(demoBattle);
  }

  await processRivalCounterAttack(supabase);
  const state = await getRivalBattleState(supabase);
  res.json(state);
});

router.post('/reset', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  if (user.username !== 'aden') {
    return res.status(403).json({ error: 'Only Aden can reset the faction war' });
  }

  if (isDemoMode || !supabase) {
    if (demoBattle.battle) {
      demoBattle.battle.rival_hp_current = 75;
      demoBattle.battle.household_hp_current = 80;
      demoBattle.battle.outcome = 'active';
      demoBattle.logs = [{ message: 'Battle reset!', actor: 'system', damage: 0 }];
    }
    return res.json(demoBattle);
  }

  const state = await resetWeeklyBattle(supabase);
  res.json(state);
});

router.post('/damage', async (req: Request, res: Response) => {
  const { damage, message } = req.body;
  if (!damage || !message) return res.status(400).json({ error: 'damage and message required' });

  if (isDemoMode || !supabase) {
    if (demoBattle.battle) {
      demoBattle.battle.rival_hp_current = Math.max(0, (demoBattle.battle.rival_hp_current as number) - damage);
      demoBattle.logs = [...(demoBattle.logs || []), { message, actor: 'household', damage }];
    }
    return res.json({ success: true });
  }

  await dealHouseholdDamage(supabase, damage, message);
  const state = await getRivalBattleState(supabase);
  res.json(state);
});

export default router;
