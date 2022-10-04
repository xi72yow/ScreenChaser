#!/usr/bin/env node
const inquirer = require("inquirer");
const chalk = require('chalk');

const yellow = chalk.hex('#ffbb00');
const pink = chalk.hex('#af0069');

function clearTerminal() {
  console.clear();
  console.log(pink('Screen') + yellow('Chaser') + ' CLI ' + 'by @xi72yow');
}

async function app() {
  clearTerminal()
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'main',
      message: 'Which spinner would you like to use?',
      choices: ["Object.keys(cliSpinners)", "Object.values(cliSpinners)", "Object.entries(cliSpinners)"]
    }
  ]);
  console.log(answers);
};
app()
/* 
inquirer
    .prompt([
        {
            type: 'checkbox',
            message: 'Select toppings',
            name: 'toppings',
            choices: [
                new inquirer.Separator(' = The Meats = '),
                {
                    name: 'Pepperoni',
                },
                {
                    name: 'Ham',
                },
                {
                    name: 'Ground Meat',
                },
                {
                    name: 'Bacon',
                },
                new inquirer.Separator(' = The Cheeses = '),
                {
                    name: 'Mozzarella',
                    checked: true,
                },
                {
                    name: 'Cheddar',
                },
                {
                    name: 'Parmesan',
                },
                new inquirer.Separator(' = The usual ='),
                {
                    name: 'Mushroom',
                },
                {
                    name: 'Tomato',
                },
                new inquirer.Separator(' = The extras = '),
                {
                    name: 'Pineapple',
                },
                {
                    name: 'Olives',
                    disabled: 'out of stock',
                },
                {
                    name: 'Extra cheese',
                },
            ],
            validate(answer) {
                if (answer.length < 1) {
                    return 'You must choose at least one topping.';
                }

                return true;
            },
        },
    ])
    .then((answers) => {
        console.log(JSON.stringify(answers, null, '  '));
    }); 
    
    console.log('Hi, welcome to Node Pizza');

const questions = [
  {
    type: 'confirm',
    name: 'toBeDelivered',
    message: 'Is this for delivery?',
    default: false,
  },
  {
    type: 'input',
    name: 'phone',
    message: "What's your phone number?",
    validate(value) {
      const pass = value.match(
        /^([01]{1})?[-.\s]?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})\s?((?:#|ext\.?\s?|x\.?\s?){1}(?:\d+)?)?$/i
      );
      if (pass) {
        return true;
      }

      return 'Please enter a valid phone number';
    },
  },
  {
    type: 'list',
    name: 'size',
    message: 'What size do you need?',
    choices: ['Large', 'Medium', 'Small'],
    filter(val) {
      return val.toLowerCase();
    },
  },
  {
    type: 'input',
    name: 'quantity',
    message: 'How many do you need?',
    validate(value) {
      const valid = !isNaN(parseFloat(value));
      return valid || 'Please enter a number';
    },
    filter: Number,
  },
  {
    type: 'expand',
    name: 'toppings',
    message: 'What about the toppings?',
    choices: [
      {
        key: 'p',
        name: 'Pepperoni and cheese',
        value: 'PepperoniCheese',
      },
      {
        key: 'a',
        name: 'All dressed',
        value: 'alldressed',
      },
      {
        key: 'w',
        name: 'Hawaiian',
        value: 'hawaiian',
      },
    ],
  },
  {
    type: 'rawlist',
    name: 'beverage',
    message: 'You also get a free 2L beverage',
    choices: ['Pepsi', '7up', 'Coke'],
  },
  {
    type: 'input',
    name: 'comments',
    message: 'Any comments on your purchase experience?',
    default: 'Nope, all good!',
  },
  {
    type: 'list',
    name: 'prize',
    message: 'For leaving a comment, you get a freebie',
    choices: ['cake', 'fries'],
    when(answers) {
      return answers.comments !== 'Nope, all good!';
    },
  },
];

inquirer.prompt(questions).then((answers) => {
  console.log('\nOrder receipt:');
  console.log(JSON.stringify(answers, null, '  '));
});
    
    */