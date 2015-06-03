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

  describe('given an player with score 4', function () {
    beforeEach(function () {
      this.ranking.setScore({ score: 4, playerId: 'jack' });
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
                    playerIds: [ 'jack' ]
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

    describe('given an player with score 18', function () {
      beforeEach(function () {
        this.ranking.setScore({ score: 18, playerId: 'john' });
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
                      playerIds: [ 'jack' ]
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
                          playerIds: [ 'john' ]
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
      this.ranking.setScore({ score: 9, playerId: 'jack' });
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
                        playerIds: [ 'jack' ]
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
