import { generateMenuReport } from './menuItemreport';
import { generateDateReport } from './report';

async function main() {
    await generateDateReport('2025-03-11');
    await generateMenuReport('2025-03-11');
}

main()