'use client';

export interface ModerationResult {
  isApproved: boolean;
  confidence: number;
  flags: ModerationFlag[];
  suggestions: string[];
  requiresReview: boolean;
  autoAction: 'none' | 'hide' | 'flag' | 'delete';
}

export interface ModerationFlag {
  type: 'spam' | 'inappropriate' | 'harassment' | 'copyright' | 'misinformation' | 'academic' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  evidence: string[];
  confidence: number;
}

export interface ModerationRule {
  id: string;
  name: string;
  description: string;
  pattern: RegExp | string;
  action: 'flag' | 'hide' | 'delete' | 'review';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  enabled: boolean;
}

export interface ModerationSettings {
  autoModeration: boolean;
  requireReview: boolean;
  spamThreshold: number;
  inappropriateThreshold: number;
  harassmentThreshold: number;
  academicIntegrityCheck: boolean;
  profanityFilter: boolean;
  linkSpamCheck: boolean;
  duplicateContentCheck: boolean;
}

export class ContentModerationSystem {
  private static readonly DEFAULT_SETTINGS: ModerationSettings = {
    autoModeration: true,
    requireReview: false,
    spamThreshold: 0.7,
    inappropriateThreshold: 0.8,
    harassmentThreshold: 0.9,
    academicIntegrityCheck: true,
    profanityFilter: true,
    linkSpamCheck: true,
    duplicateContentCheck: true
  };

  private static readonly PROFANITY_WORDS = [
    // Common profanity words (censored for safety)
    'badword1', 'badword2', 'badword3'
  ];

  private static readonly SPAM_PATTERNS = [
    /\b(?:buy|sell|discount|offer|limited|free|click|visit|website)\b/gi,
    /\b(?:money|cash|earn|income|profit|investment)\b/gi,
    /\b(?:weight|loss|diet|supplement|pill)\b/gi,
    /\b(?:loan|credit|debt|mortgage|refinance)\b/gi
  ];

  private static readonly ACADEMIC_VIOLATIONS = [
    /\b(?:cheat|plagiarism|copy|steal|buy.*essay|pay.*assignment)\b/gi,
    /\b(?:exam.*answers|test.*cheat|homework.*help.*paid)\b/gi
  ];

  /**
   * Moderate post content
   */
  static async moderateContent(
    content: string,
    author: { id: string; verified: boolean; reputation?: number },
    settings: Partial<ModerationSettings> = {}
  ): Promise<ModerationResult> {
    const finalSettings = { ...this.DEFAULT_SETTINGS, ...settings };
    const flags: ModerationFlag[] = [];
    let totalConfidence = 0;
    let flagCount = 0;

    // Check for profanity
    if (finalSettings.profanityFilter) {
      const profanityResult = this.checkProfanity(content);
      if (profanityResult.flag) {
        flags.push(profanityResult.flag);
        totalConfidence += profanityResult.flag.confidence;
      }
    }

    // Check for spam
    if (finalSettings.linkSpamCheck) {
      const spamResult = this.checkSpam(content);
      if (spamResult.flag) {
        flags.push(spamResult.flag);
        totalConfidence += spamResult.flag.confidence;
      }
    }

    // Check for harassment
    const harassmentResult = this.checkHarassment(content);
    if (harassmentResult.flag) {
      flags.push(harassmentResult.flag);
      totalConfidence += harassmentResult.flag.confidence;
    }

    // Check for academic integrity violations
    if (finalSettings.academicIntegrityCheck) {
      const academicResult = this.checkAcademicIntegrity(content);
      if (academicResult.flag) {
        flags.push(academicResult.flag);
        totalConfidence += academicResult.flag.confidence;
      }
    }

    // Check for inappropriate content
    const inappropriateResult = this.checkInappropriateContent(content);
    if (inappropriateResult.flag) {
      flags.push(inappropriateResult.flag);
      totalConfidence += inappropriateResult.flag.confidence;
    }

    // Calculate overall confidence and determine action
    const averageConfidence = flagCount > 0 ? totalConfidence / flagCount : 0;
    const isApproved = this.shouldApprove(averageConfidence, flags, finalSettings);
    const autoAction = this.determineAutoAction(flags, finalSettings);

    return {
      isApproved,
      confidence: averageConfidence,
      flags,
      suggestions: this.generateSuggestions(flags),
      requiresReview: this.requiresReview(flags, finalSettings),
      autoAction
    };
  }

  /**
   * Check for profanity in content
   */
  private static checkProfanity(content: string): { flagged: boolean; flag?: ModerationFlag } {
    const contentLower = content.toLowerCase();
    const foundProfanity = this.PROFANITY_WORDS.filter(word => 
      contentLower.includes(word.toLowerCase())
    );

    if (foundProfanity.length === 0) {
      return { flagged: false };
    }

    return {
      flagged: true,
      flag: {
        type: 'inappropriate',
        severity: 'medium',
        reason: 'Profanity detected',
        evidence: foundProfanity,
        confidence: Math.min(0.9, foundProfanity.length * 0.3)
      }
    };
  }

  /**
   * Check for spam patterns
   */
  private static checkSpam(content: string): { flagged: boolean; flag?: ModerationFlag } {
    let spamScore = 0;
    const evidence: string[] = [];

    // Check for spam patterns
    this.SPAM_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        spamScore += matches.length;
        evidence.push(...matches);
      }
    });

    // Check for excessive links
    const linkMatches = content.match(/https?:\/\/[^\s]+/g);
    if (linkMatches && linkMatches.length > 3) {
      spamScore += linkMatches.length - 3;
      evidence.push(`Excessive links: ${linkMatches.length}`);
    }

    // Check for repetitive text
    const words = content.toLowerCase().split(/\s+/);
    const wordCounts: { [key: string]: number } = {};
    words.forEach(word => {
      if (word.length > 3) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });

    const repetitiveWords = Object.entries(wordCounts)
      .filter(([_, count]) => count > 5)
      .map(([word, count]) => `${word} (${count}x)`);

    if (repetitiveWords.length > 0) {
      spamScore += repetitiveWords.length;
      evidence.push(`Repetitive words: ${repetitiveWords.join(', ')}`);
    }

    if (spamScore < 3) {
      return { flagged: false };
    }

    return {
      flagged: true,
      flag: {
        type: 'spam',
        severity: spamScore > 5 ? 'high' : 'medium',
        reason: 'Spam patterns detected',
        evidence,
        confidence: Math.min(0.95, spamScore * 0.15)
      }
    };
  }

  /**
   * Check for harassment
   */
  private static checkHarassment(content: string): { flagged: boolean; flag?: ModerationFlag } {
    const harassmentPatterns = [
      /\b(?:kill|hurt|attack|hate|stupid|idiot|moron)\b/gi,
      /\b(?:racist|sexist|homophobic|transphobic)\b/gi,
      /\b(?:bully|harass|stalk|threaten)\b/gi
    ];

    let harassmentScore = 0;
    const evidence: string[] = [];

    harassmentPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        harassmentScore += matches.length;
        evidence.push(...matches);
      }
    });

    if (harassmentScore === 0) {
      return { flagged: false };
    }

    return {
      flagged: true,
      flag: {
        type: 'harassment',
        severity: harassmentScore > 2 ? 'high' : 'medium',
        reason: 'Potential harassment detected',
        evidence,
        confidence: Math.min(0.9, harassmentScore * 0.3)
      }
    };
  }

  /**
   * Check for academic integrity violations
   */
  private static checkAcademicIntegrity(content: string): { flagged: boolean; flag?: ModerationFlag } {
    let violationScore = 0;
    const evidence: string[] = [];

    this.ACADEMIC_VIOLATIONS.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        violationScore += matches.length;
        evidence.push(...matches);
      }
    });

    if (violationScore === 0) {
      return { flagged: false };
    }

    return {
      flagged: true,
      flag: {
        type: 'academic',
        severity: 'critical',
        reason: 'Academic integrity violation detected',
        evidence,
        confidence: Math.min(0.95, violationScore * 0.4)
      }
    };
  }

  /**
   * Check for inappropriate content
   */
  private static checkInappropriateContent(content: string): { flagged: boolean; flag?: ModerationFlag } {
    const inappropriatePatterns = [
      /\b(?:nude|naked|sex|porn|adult)\b/gi,
      /\b(?:drug|alcohol|drunk|high)\b/gi,
      /\b(?:violence|blood|gore|death)\b/gi
    ];

    let inappropriateScore = 0;
    const evidence: string[] = [];

    inappropriatePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        inappropriateScore += matches.length;
        evidence.push(...matches);
      }
    });

    if (inappropriateScore === 0) {
      return { flagged: false };
    }

    return {
      flagged: true,
      flag: {
        type: 'inappropriate',
        severity: inappropriateScore > 2 ? 'high' : 'medium',
        reason: 'Inappropriate content detected',
        evidence,
        confidence: Math.min(0.9, inappropriateScore * 0.3)
      }
    };
  }

  /**
   * Determine if content should be approved
   */
  private static shouldApprove(
    confidence: number,
    flags: ModerationFlag[],
    settings: ModerationSettings
  ): boolean {
    if (flags.length === 0) return true;

    const criticalFlags = flags.filter(f => f.severity === 'critical');
    if (criticalFlags.length > 0) return false;

    const highSeverityFlags = flags.filter(f => f.severity === 'high');
    if (highSeverityFlags.length > 0 && confidence > settings.inappropriateThreshold) {
      return false;
    }

    return confidence < settings.spamThreshold;
  }

  /**
   * Determine automatic action to take
   */
  private static determineAutoAction(
    flags: ModerationFlag[],
    settings: ModerationSettings
  ): 'none' | 'hide' | 'flag' | 'delete' {
    if (flags.length === 0) return 'none';

    const criticalFlags = flags.filter(f => f.severity === 'critical');
    if (criticalFlags.length > 0) return 'delete';

    const highSeverityFlags = flags.filter(f => f.severity === 'high');
    if (highSeverityFlags.length > 0) return 'hide';

    return 'flag';
  }

  /**
   * Determine if content requires manual review
   */
  private static requiresReview(
    flags: ModerationFlag[],
    settings: ModerationSettings
  ): boolean {
    if (settings.requireReview) return true;
    if (flags.length === 0) return false;

    const mediumOrHigher = flags.filter(f => 
      f.severity === 'medium' || f.severity === 'high' || f.severity === 'critical'
    );

    return mediumOrHigher.length > 0;
  }

  /**
   * Generate suggestions for flagged content
   */
  private static generateSuggestions(flags: ModerationFlag[]): string[] {
    const suggestions: string[] = [];

    flags.forEach(flag => {
      switch (flag.type) {
        case 'spam':
          suggestions.push('Remove excessive promotional language and links');
          suggestions.push('Avoid repetitive text and excessive hashtags');
          break;
        case 'inappropriate':
          suggestions.push('Remove inappropriate language and content');
          suggestions.push('Keep content suitable for academic environment');
          break;
        case 'harassment':
          suggestions.push('Remove harassing or threatening language');
          suggestions.push('Maintain respectful communication');
          break;
        case 'academic':
          suggestions.push('Ensure academic integrity in your content');
          suggestions.push('Avoid promoting cheating or plagiarism');
          break;
        case 'other':
          suggestions.push('Review content for potential issues');
          break;
      }
    });

    return [...new Set(suggestions)];
  }

  /**
   * Get moderation statistics
   */
  static async getModerationStats(): Promise<{
    totalPosts: number;
    flaggedPosts: number;
    autoApproved: number;
    requiresReview: number;
    flaggedByType: { [key: string]: number };
  }> {
    // In a real app, this would query the database
    return {
      totalPosts: 0,
      flaggedPosts: 0,
      autoApproved: 0,
      requiresReview: 0,
      flaggedByType: {}
    };
  }

  /**
   * Update moderation rules
   */
  static async updateModerationRules(rules: ModerationRule[]): Promise<void> {
    // In a real app, this would update the database
    console.log('Updating moderation rules:', rules.length);
  }

  /**
   * Get moderation settings
   */
  static async getModerationSettings(): Promise<ModerationSettings> {
    // In a real app, this would fetch from database
    return this.DEFAULT_SETTINGS;
  }

  /**
   * Update moderation settings
   */
  static async updateModerationSettings(settings: Partial<ModerationSettings>): Promise<void> {
    // In a real app, this would update the database
    console.log('Updating moderation settings:', settings);
  }
}
