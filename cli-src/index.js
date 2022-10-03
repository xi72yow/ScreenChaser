import cliSpinners from 'cli-spinners';
import select from '@inquirer/select';
import logUpdate from 'log-update';

/* const frames = ['-', '\\', '|', '/'];
let index = 0;

setInterval(() => {
    const frame = frames[index = ++index % frames.length];

    logUpdate(
        `
        ♥♥
   ${frame} unicorns ${frame}
        ♥♥
`
    );
}, 80);

console.log(cliSpinners.dots); */

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