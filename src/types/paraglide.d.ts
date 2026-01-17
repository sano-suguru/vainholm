declare module '../paraglide/runtime.js' {
  export const baseLocale: 'ja';
  export const locales: readonly ['ja', 'en'];
  export type Locale = 'ja' | 'en';
  export function getLocale(): Locale;
  export function setLocale(
    locale: Locale,
    options?: { reload?: boolean }
  ): void;
}

declare module '../paraglide/messages.js' {
  import type { Locale } from '../paraglide/runtime.js';

  type LocalizedString = string & { __brand: 'LocalizedString' };
  type MessageOptions = { locale?: Locale };

  // UI messages
  export function ui_turn(
    inputs: { turn: number | string },
    options?: MessageOptions
  ): LocalizedString;
  export function ui_combat_log(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function ui_return_to_world(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;

  // Game over messages
  export function game_over_defeat_title(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function game_over_defeat_message(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function game_over_victory_title(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function game_over_victory_message(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;

  // Combat messages
  export function combat_player_kill(
    inputs: { enemy: string },
    options?: MessageOptions
  ): LocalizedString;
  export function combat_player_hit(
    inputs: { enemy: string; damage: number | string },
    options?: MessageOptions
  ): LocalizedString;
  export function combat_player_hit_critical(
    inputs: { enemy: string; damage: number | string },
    options?: MessageOptions
  ): LocalizedString;
  export function combat_player_stealth_attack(
    inputs: { enemy: string; damage: number | string },
    options?: MessageOptions
  ): LocalizedString;
  export function combat_enemy_attack(
    inputs: { enemy: string; damage: number | string },
    options?: MessageOptions
  ): LocalizedString;

  export function combat_boss_divine_smite(
    inputs: { boss: string; damage: number | string },
    options?: MessageOptions
  ): LocalizedString;
  export function combat_boss_root_grasp(
    inputs: { boss: string; damage: number | string },
    options?: MessageOptions
  ): LocalizedString;
  export function combat_boss_spectral_slash(
    inputs: { boss: string; damage: number | string },
    options?: MessageOptions
  ): LocalizedString;
  export function combat_boss_summon_shades(
    inputs: { boss: string; count: number | string },
    options?: MessageOptions
  ): LocalizedString;
  export function combat_boss_void_pulse(
    inputs: { boss: string; damage: number | string },
    options?: MessageOptions
  ): LocalizedString;
  export function combat_boss_reality_tear(
    inputs: { boss: string; damage: number | string },
    options?: MessageOptions
  ): LocalizedString;
  export function combat_boss_attack(
    inputs: { boss: string; damage: number | string },
    options?: MessageOptions
  ): LocalizedString;

  export function status_poison(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function status_bleed(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function status_burn(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function status_stun(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function status_slow(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function status_blind(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;

  // Enemy names
  export function enemy_skeleton(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function enemy_ghost(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function enemy_cultist(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function enemy_wraith(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function enemy_crawler(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function enemy_shade(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function enemy_hollow_knight(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function enemy_blight_spawn(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function enemy_void_worm(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;

  export function boss_hrodrvardr(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function boss_rotgroftr(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function boss_gleymdkonungr(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function boss_oerslbarn(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;

  // Region names
  export function region_hrodrgraf(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function region_rotmyrkr(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function region_gleymdariki(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function region_upphafsdjup(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function region_frostdjup(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function region_sannleiksholmr(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function region_world(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;
  export function region_unknown(
    inputs?: Record<string, never>,
    options?: MessageOptions
  ): LocalizedString;

}
