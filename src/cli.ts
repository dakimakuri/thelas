import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as readline from 'readline';
import { ResourceGroup } from './resource-group';
import { Resource } from './resource';
import { Args } from './args';
const chalk = require('chalk');
const makeError = require('make-error');
const yargs = require('yargs');

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

function prettyType(obj: any) {
  if (obj instanceof Function) {
    return '(calculated)';
  } else {
    let str = String(obj);
    if (str.length > 40) {
      str = str.substr(0, 40) + '...';
    }
    str = str.replace(/\n/g, '\\n');
    return '"' + str + '"';
  }
}

function prettyDiff(diff: any, name = '') {
  if (name) name = ' (' + name + ')';
  if (diff.create && diff.destroy) {
    console.log(chalk.yellow('~ update') + chalk.red(' (recreate)') + name + (diff.tainted ? chalk.red(' (tainted)') : ''));
    for (let change of diff.changes) {
      let tag = '';
      if (change.schema.fragile) tag += chalk.red(' (requires new resource)');
      console.log('  ' + chalk.yellow('~ ' + change.path + ':') + ' ' + prettyType(_.get(diff.destroy, change.path)) + ' => ' + prettyType(_.get(diff.create, change.path)) + tag);
    }
    console.log();
  } else if (diff.create) {
    console.log(chalk.green('+ create') + name);
    for (let change of diff.changes) {
      let value = _.get(diff.create, change.path);
      if (value != null) {
        console.log('  ' + chalk.green('+ ' + change.path + ':') + ' ' + prettyType(value));
      }
    }
    console.log();
  } else if (diff.destroy) {
    console.log(chalk.red('- destroy') + name);
    console.log();
  } else if (diff.update) {
    console.log(chalk.yellow('~ update') + name);
    for (let change of diff.changes) {
      console.log('  ' + chalk.yellow('~ ' + change.path + ':') + ' ' + prettyType(_.get(diff.update.from, change.path)) + ' => ' + prettyType(_.get(diff.update.to, change.path)));
    }
    console.log();
  } else {
    console.log(chalk.green('Nothing to do.'));
  }
}

function ref(name: string, attribute: string) {
  return (event: any) => {
    let find = _.find(event.context, { name }) as any;
    return find.resource.attributes[attribute];
  };
}

let argv = yargs
.command('apply', 'apply changes', (yargs) => {}, async (argv) => {
  try {
    let input = await fs.readJson('input.json');
    let group = new ResourceGroup();
    group.on('create', (name: string) => console.log(`Creating ${name}...`));
    group.on('update', (name: string) => console.log(`Updating ${name}...`));
    group.on('destroy', (name: string) => console.log(`Destroying ${name}...`));
    group.on('sync', (name: string) => console.log(`Syncing ${name}...`));
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
        group.state[update.name].data = update.sync;
      }
    }
    try {
      if (different) {
        await confirm('Apply these changes?');
        await group.apply(updates);
      } else {
        console.log(chalk.green('Nothing to do.'));
      }
    } finally {
      await fs.writeFile('state.json', JSON.stringify(group.state, null, 2));
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
})
.command('import <name> <id>', 'import resource', (yargs) => {}, async (argv) => {
  rl.close();
  let input = await fs.readJson('input.json');
  let group = new ResourceGroup();
  try {
    group.state = await fs.readJson('state.json');
  } catch (err) {
    if (_.get(err, 'code') !== 'ENOENT') {
      throw err;
    }
  }
  if (!input[argv.name]) {
    throw new Error('The resource "' + argv.name + '" does not exist in input.json.');
  }
  let diff = await group.diff(input);
  await group.import(diff, argv.name, argv.id);
  await fs.writeFile('state.json', JSON.stringify(group.state, null, 2));
})
.command('import-list <input>', 'import resource', (yargs) => {}, async (argv) => {
  rl.close();
  let input = await fs.readJson('input.json');
  let group = new ResourceGroup();
  try {
    group.state = await fs.readJson('state.json');
  } catch (err) {
    if (_.get(err, 'code') !== 'ENOENT') {
      throw err;
    }
  }
  let imports = await fs.readJson(argv.input);
  let diff = await group.diff(input);
  for (let name in imports) {
    let id = imports[name];
    if (input[name]) {
      try {
        await group.import(diff, name, id);
        console.log(chalk.green('Success: ' + name));
      } catch (err) {
        console.log(chalk.red('Failed: ' + name));
      }
    } else {
      console.log(chalk.yellow('Ignoring: ' + name));
    }
  }
  await fs.writeFile('state.json', JSON.stringify(group.state, null, 2));
})
.option('verbose', {
  alias: 'v',
  default: true
})
.argv;
