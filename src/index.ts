import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as readline from 'readline';
import { ResourceGroup } from './resource-group';
const chalk = require('chalk');
const makeError = require('make-error');

const UserCancelledError = makeError('UserCancelledError');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
function confirm(q: string) {
  return new Promise((resolve, reject) => {
    rl.question(q + ' [y/n]: ', (answer) => {
      if (answer == 'y') resolve(); else reject(new UserCancelledError());
    });
  });
}

function prettyDiff(diff: any, name = '') {
  if (name) name = ' (' + name + ')';
  if (diff.create && diff.destroy) {
    console.log(chalk.yellow('~ update') + chalk.red(' (recreate)') + name + (diff.tainted ? chalk.red(' (tainted)') : ''));
    for (let change of diff.changes) {
      let tag = '';
      if (change.schema.fragile) tag += chalk.red(' (requires new resource)');
      console.log('  ' + chalk.yellow('~ ' + change.path) + ' ("' + _.get(diff.destroy, change.path) + '" => "' + _.get(diff.create, change.path) + '")' + tag);
    }
    console.log();
  } else if (diff.create) {
    console.log(chalk.green('+ create') + name);
    for (let change of diff.changes) {
      console.log('  ' + chalk.green('+ ' + change.path) + ' ("' + _.get(diff.create, change.path) + '")');
    }
    console.log();
  } else if (diff.destroy) {
    console.log(chalk.red('- destroy') + name);
    console.log();
  } else if (diff.update) {
    console.log(chalk.yellow('~ update') + name);
    for (let change of diff.changes) {
      console.log('  ' + chalk.yellow('~ ' + change.path) + ' ("' + _.get(diff.update.from, change.path) + '" => "' + _.get(diff.update.to, change.path) + '")');
    }
    console.log();
  }
}

(async() => {
  try {

    let input = await fs.readJson('input.json');
    let group = new ResourceGroup();
    try {
      group.state = await fs.readJson('state.json');
    } catch (err) {
      if (_.get(err, 'code') !== 'ENOENT') {
        throw err;
      }
    }
    let updates = await group.diff(input);

    let different = false;
    for (let update of updates) {
      if (update.diff.different) {
        prettyDiff(update.diff, update.resource.name);
        different = true;
      } else {
        group.state[update.name] = update.resource.state;
      }
    }
    if (different) {
      await confirm('Apply these changes?');
      await group.apply(updates);
      await fs.writeFile('state.json', JSON.stringify(group.state, null, 2));
    } else {
      console.log(chalk.green('Nothing to do.'));
    }
  } catch (err) {
    if (err instanceof UserCancelledError) {
      console.error();
      console.error(chalk.red('User cancelled.'));
    } else {
      console.error(err);
    }
  } finally {
    rl.close();
  }
})();
