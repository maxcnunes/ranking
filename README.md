# ranking

[![Build Status](https://travis-ci.org/maxcnunes/ranking.svg?branch=master)](https://travis-ci.org/maxcnunes/ranking)
[![Coverage Status](https://coveralls.io/repos/maxcnunes/ranking/badge.svg)](https://coveralls.io/r/maxcnunes/ranking)
[![npm version](https://badge.fury.io/js/ranking.svg)](http://badge.fury.io/js/ranking)

Based on: [Fast and reliable ranking in datastore](https://cloud.google.com/datastore/docs/articles/fast-and-reliable-ranking-in-datastore)

![](https://cloud.google.com/datastore/docs/articles/images/fast-and-reliable-ranking-in-datastore/image05.png)

**IMPORTANT**
The current implementation does not have auto balance. Which makes inserting faster. But in cases when the game does not have a max score is necessary define in the ranking a huge number for `maxScore` to avoid any user reach the limit. Which works but is an annoying solution.
I am working in the implementation with auto balance in a new branch. Probably the changes will affect only the internal code so the public api will still the same with no break changes.

## Installation

Install via npm:

```bash
$ npm install ranking
```

## Usage

```js
// the example uses es6 but it works with es5 as well
import Ranking from 'ranking';

const ranking = new Ranking({
  maxScore: 1000000,
  branchFactor: 1000
});
```

#### add player points

```js
ranking.addPlayerPoints({ playerId: 10, points: 28 });
// { position: 1, score: 28, playerId: 20 }
```

#### find

```js
// by score
ranking.find({ score: { $gte: 1, $lte: 30 }, $limit: 10 });
ranking.find({ score: 20, $limit: 10 });
ranking.findOne({ score: 20 });

// by position
ranking.find({ position: { $gte: 1, $lte: 30 }, $limit: 10 });
ranking.find({ position: 20 });
ranking.findOne({ position: 20 });

// by player id
ranking.findOne({ playerId: 29 });
```

## Contributing

It is required to use [editorconfig](http://editorconfig.org/) and please write and run specs before pushing any changes:

```js
npm test
```

## License

Copyright (c) 2015 Max Claus Nunes. This software is licensed under the [MIT License](http://raw.github.com/maxcnunes/ranking/master/LICENSE).
