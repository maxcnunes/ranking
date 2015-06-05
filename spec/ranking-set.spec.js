import { expect } from 'chai';
import Ranking from '../src';


describe('ranking-set', function () {
  beforeEach(function () {
    this.ranking = new Ranking({ maxScore: 30, branchFactor: 3 });
  });

  it('should start with only the root node', function () {
    expect(this.ranking.tree).to.eql({
      amount: 0,
      children: null
    });
  });

  describe('given an player with a non-number id', function () {
    beforeEach(function () {
      try {
        this.ranking.setScore({ score: 4, playerId: 'jack' });
      } catch (e) {
        this.errorMessage = e;
      }
    });

    it('should throw an expection', function () {
      expect(this.errorMessage).to.eql(new Error('playerId must be a number'));
    });

    it('should not inlcude him in the ranking', function () {
      expect(this.ranking.tree).to.eql({
        amount: 0,
        children: null
      });
    });
  });

  describe('given 10 users', function () {
    it('should return the current position for each inserted player score', function () {
      expect(this.ranking.setScore({ score: 4, playerId: 1 })).to.eql(1);
      expect(this.ranking.setScore({ score: 2, playerId: 2 })).to.eql(2);
      expect(this.ranking.setScore({ score: 3, playerId: 3 })).to.eql(2);
      expect(this.ranking.setScore({ score: 10, playerId: 4 })).to.eql(1);
      expect(this.ranking.setScore({ score: 10, playerId: 5 })).to.eql(2);
      expect(this.ranking.setScore({ score: 30, playerId: 6 })).to.eql(1);
      expect(this.ranking.setScore({ score: 3, playerId: 7 })).to.eql(6);
    });
  });

  describe('given an player with score 4', function () {
    beforeEach(function () {
      this.resultPosition = this.ranking.setScore({ score: 4, playerId: 10 });
    });

    it('should return the player\'s position in the ranking', function () {
      expect(this.resultPosition).to.eql(1);
    });

    it('should stores the player\'s id in the node for score 4', function () {
      expect(this.ranking.tree).to.eql({
        amount: 1,
        children: [
          // 0-9
          {
            amount: 1,
            children: [
              // 0-2
              { amount: 0 },
              // 3-5
              {
                amount: 1,
                children: [
                  // 3
                  { amount: 0 },
                  // 4
                  {
                    amount: 1,
                    score: 4,
                    playerIds: [ 10 ]
                  },
                  { amount: 0 }
                ]
              },
              // 6-9
              { amount: 0 }
            ]
          },
          // 10-19
          { amount: 0 },
          // 20-29
          { amount: 0 }
        ]
      });
    });

    describe('given another player with score 18', function () {
      beforeEach(function () {
        this.resultPosition = this.ranking.setScore({ score: 18, playerId: 15 });
      });

      it('should return the player\'s position in the ranking', function () {
        expect(this.resultPosition).to.eql(1);
      });

      it('should stores the player\'s id in the node for score 18', function () {
        expect(this.ranking.tree).to.eql({
          amount: 2,
          children: [
            // 0-9
            {
              amount: 1,
              children: [
                // 0-2
                { amount: 0 },
                // 3-5
                {
                  amount: 1,
                  children: [
                    // 3
                    { amount: 0 },
                    // 4
                    {
                      amount: 1,
                      score: 4,
                      playerIds: [ 10 ]
                    },
                    { amount: 0 }
                  ]
                },
                // 6-9
                { amount: 0 }
              ]
            },
            // 10-19
            {
              amount: 1,
              children: [
                // 10-12
                { amount: 0 },
                // 13-15
                { amount: 0 },
                // 16-19
                {
                  amount: 1,
                  children: [
                    // 16
                    { amount: 0 },
                    // 17
                    { amount: 0 },
                    // 18-19
                    {
                      amount: 1,
                      children: [
                        // 18
                        {
                          amount: 1,
                          score: 18,
                          playerIds: [ 15 ]
                        },
                        // 19
                        { amount: 0 }
                      ]
                    }
                  ]
                }
              ]
            },
            // 20-29
            { amount: 0 }
          ]
        });
      });
    });
  });

  describe('given an player with score 9', function () {
    beforeEach(function () {
      this.ranking.setScore({ score: 9, playerId: 10 });
    });

    it('should stores the player\'s id in the node for score 9', function () {
      expect(this.ranking.tree).to.eql({
        amount: 1,
        children: [
          // 0-9
          {
            amount: 1,
            children: [
              // 0-2
              { amount: 0 },
              // 3-5
              { amount: 0 },
              // 6-9
              {
                amount: 1,
                children: [
                  // 6
                  { amount: 0 },
                  // 7
                  { amount: 0 },
                  // 8-9
                  {
                    amount: 1,
                    children: [
                      // 8
                      { amount: 0 },
                      // 9
                      {
                        amount: 1,
                        score: 9,
                        playerIds: [ 10 ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          // 10-19
          { amount: 0 },
          // 20-29
          { amount: 0 }
        ]
      });
    });
  });
});
