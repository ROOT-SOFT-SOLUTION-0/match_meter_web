import { TournamentService } from './tournament.service';

/**
 * Background service to check registration deadlines and auto-generate brackets
 * Should be called periodically (every minute recommended)
 */
export class BracketGenerationService {
  private static isChecking = false;
  private static checkInterval: NodeJS.Timeout | null = null;

  /**
   * Start automatic bracket generation checker
   * @param intervalMs - Check interval in milliseconds (default: 60000 = 1 minute)
   */
  static startAutoCheck(intervalMs: number = 60000): void {
    if (this.checkInterval) {
      console.log('Bracket generation checker already running');
      return;
    }

    console.log(
      `Starting automatic bracket generation checker (interval: ${intervalMs}ms)`
    );

    // Initial check
    this.checkDeadlines();

    // Set interval for periodic checks
    this.checkInterval = setInterval(() => {
      this.checkDeadlines();
    }, intervalMs);
  }

  /**
   * Stop automatic bracket generation checker
   */
  static stopAutoCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Stopped automatic bracket generation checker');
    }
  }

  /**
   * Manual check for deadlines
   */
  private static async checkDeadlines(): Promise<void> {
    if (this.isChecking) {
      return;
    }

    try {
      this.isChecking = true;

      const results = await TournamentService.checkAndGenerateBrackets();

      if (results.length > 0) {
        console.log(
          `✓ Generated brackets for ${results.length} tournament(s):`,
          results
        );

        // Notify admins via toast/notification
        results.forEach((result) => {
          console.log(
            `Bracket generated for tournament ${result.tournamentId}`
          );
        });
      }
    } catch (error) {
      console.error('Error checking registration deadlines:', error);
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Manually trigger bracket generation for specific tournament
   * (Useful for testing or manual override)
   */
  static async manuallyGenerateBracket(
    tournamentId: string,
    format: 'single_elimination' | 'double_elimination' = 'single_elimination'
  ): Promise<string> {
    try {
      const { BracketService } = await import('./bracket.service');

      const result = await BracketService.generateBracket(
        tournamentId,
        format
      );

      console.log(
        `Manually generated bracket for tournament ${tournamentId}`
      );

      return result.bracketConfigId;
    } catch (error) {
      console.error('Error manually generating bracket:', error);
      throw error;
    }
  }
}
