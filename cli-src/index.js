import cliSpinners from 'cli-spinners';
import select from '@inquirer/select';

console.log(cliSpinners.dots);

const answer = await select({
    message: 'Select a package manager',
    choices: [
        {
            name: 'npm',
            value: 'npm',
            description: 'npm is the most popular package manager',
        },
        {
            name: 'yarn',
            value: 'yarn',
            description: 'yarn is an awesome package manager',
        },
        {
            name: 'jspm',
            value: 'jspm',
            disabled: true,
        },
    ],
});