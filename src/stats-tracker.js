/**
 * StatsTracker — tracks roast history, streaks, and focus sessions.
 */
class StatsTracker {
  constructor(store) {
    this.store = store;
  }

  recordRoast() {
    const today = this._today();
    const dailyStats = this.store.get('dailyStats', {});

    if (!dailyStats[today]) {
      dailyStats[today] = { roasts: 0, focusReturns: 0 };
    }
    dailyStats[today].roasts++;

    this.store.set('dailyStats', dailyStats);
  }

  recordFocusReturn() {
    const today = this._today();
    const dailyStats = this.store.get('dailyStats', {});

    if (!dailyStats[today]) {
      dailyStats[today] = { roasts: 0, focusReturns: 0 };
    }
    dailyStats[today].focusReturns++;
    this.store.set('dailyStats', dailyStats);

    this._updateStreak(today);
  }

  _updateStreak(today) {
    const lastFocusDate = this.store.get('lastFocusDate', null);

    if (!lastFocusDate) {
      this.store.set('streak', 1);
      this.store.set('lastFocusDate', today);
      return;
    }

    if (lastFocusDate === today) return; // already counted today

    const yesterday = this._daysAgo(1);
    if (lastFocusDate === yesterday) {
      // Consecutive day — increment streak
      this.store.set('streak', (this.store.get('streak', 0)) + 1);
    } else {
      // Streak broken — reset
      this.store.set('streak', 1);
    }

    this.store.set('lastFocusDate', today);
  }

  getWeeklySummary() {
    const dailyStats = this.store.get('dailyStats', {});
    const summary = [];

    for (let i = 6; i >= 0; i--) {
      const date = this._daysAgo(i);
      summary.push({
        date,
        label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : new Date(date).toLocaleDateString('en', { weekday: 'short' }),
        roasts: dailyStats[date]?.roasts || 0,
        focusReturns: dailyStats[date]?.focusReturns || 0,
      });
    }

    return summary;
  }

  _today() {
    return new Date().toISOString().split('T')[0];
  }

  _daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  }
}

module.exports = StatsTracker;
