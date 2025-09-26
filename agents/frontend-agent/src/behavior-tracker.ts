import { UserBehaviorMetrics, MouseMovement, ClickEvent } from './types.js';
import { DataCollectionUtils } from './utils.js';

export class BehaviorTracker {
  private mouseClicks: number = 0;
  private keystrokes: number = 0;
  private scrollEvents: number = 0;
  private formInteractions: number = 0;
  private navigationEvents: number = 0;
  private idleTime: number = 0;
  private mouseMovements: MouseMovement[] = [];
  private clickPattern: ClickEvent[] = [];
  
  private lastActivity: number = Date.now();
  private isIdle: boolean = false;
  private idleThreshold: number = 30000; // 30 seconds
  private excludeSelectors: string[];

  constructor(excludeSelectors: string[] = []) {
    this.excludeSelectors = excludeSelectors;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Mouse click tracking
    document.addEventListener('click', this.handleClick.bind(this), { passive: true });
    
    // Keystroke tracking
    document.addEventListener('keydown', this.handleKeydown.bind(this), { passive: true });
    
    // Scroll tracking
    window.addEventListener('scroll', DataCollectionUtils.throttle(this.handleScroll.bind(this), 100), { passive: true });
    
    // Form interaction tracking
    document.addEventListener('input', this.handleFormInteraction.bind(this), { passive: true });
    document.addEventListener('change', this.handleFormInteraction.bind(this), { passive: true });
    
    // Navigation tracking
    window.addEventListener('popstate', this.handleNavigation.bind(this), { passive: true });
    
    // Mouse movement tracking (throttled to avoid performance issues)
    document.addEventListener('mousemove', DataCollectionUtils.throttle(this.handleMouseMove.bind(this), 100), { passive: true });
    
    // Idle time tracking
    this.startIdleTracking();
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as Element;
    
    if (DataCollectionUtils.shouldExcludeElement(target, this.excludeSelectors)) {
      return;
    }

    this.mouseClicks++;
    this.resetIdleTimer();
    
    // Store click pattern for behavior analysis
    const clickEvent: ClickEvent = {
      element: DataCollectionUtils.getElementSelector(target),
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now(),
      button: event.button
    };
    
    this.clickPattern.push(clickEvent);
    
    // Keep only last 50 clicks to manage memory
    if (this.clickPattern.length > 50) {
      this.clickPattern.shift();
    }
  }

  private handleKeydown(event: KeyboardEvent): void {
    const target = event.target as Element;
    
    if (DataCollectionUtils.shouldExcludeElement(target, this.excludeSelectors)) {
      return;
    }

    this.keystrokes++;
    this.resetIdleTimer();
  }

  private handleScroll(): void {
    this.scrollEvents++;
    this.resetIdleTimer();
  }

  private handleFormInteraction(event: Event): void {
    const target = event.target as Element;
    
    if (DataCollectionUtils.shouldExcludeElement(target, this.excludeSelectors)) {
      return;
    }

    this.formInteractions++;
    this.resetIdleTimer();
  }

  private handleNavigation(): void {
    this.navigationEvents++;
    this.resetIdleTimer();
  }

  private handleMouseMove(event: MouseEvent): void {
    const movement: MouseMovement = {
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now()
    };
    
    this.mouseMovements.push(movement);
    this.resetIdleTimer();
    
    // Keep only last 100 movements to manage memory
    if (this.mouseMovements.length > 100) {
      this.mouseMovements.shift();
    }
  }

  private startIdleTracking(): void {
    setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - this.lastActivity;
      
      if (timeSinceLastActivity > this.idleThreshold && !this.isIdle) {
        this.isIdle = true;
      } else if (timeSinceLastActivity <= this.idleThreshold && this.isIdle) {
        this.isIdle = false;
      }
      
      if (this.isIdle) {
        this.idleTime += 1000; // Add 1 second
      }
    }, 1000);
  }

  private resetIdleTimer(): void {
    this.lastActivity = Date.now();
    this.isIdle = false;
  }

  public getMetrics(): UserBehaviorMetrics {
    return {
      mouseClicks: this.mouseClicks,
      keystrokes: this.keystrokes,
      scrollEvents: this.scrollEvents,
      formInteractions: this.formInteractions,
      navigationEvents: this.navigationEvents,
      idleTime: this.idleTime,
      mouseMovements: [...this.mouseMovements], // Create a copy
      clickPattern: [...this.clickPattern] // Create a copy
    };
  }

  public reset(): void {
    this.mouseClicks = 0;
    this.keystrokes = 0;
    this.scrollEvents = 0;
    this.formInteractions = 0;
    this.navigationEvents = 0;
    this.idleTime = 0;
    this.mouseMovements = [];
    this.clickPattern = [];
    this.lastActivity = Date.now();
    this.isIdle = false;
  }

  public destroy(): void {
    // Clean up event listeners if needed
    // Note: Modern browsers handle this automatically when page unloads
  }
}