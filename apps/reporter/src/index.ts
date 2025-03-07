import { generateMenuReport } from './menuItemreport';
import { generateDateReport } from './report';

async function main() {
    await generateDateReport('2025-03-05');
    await generateMenuReport('2025-03-05');
}

main()