import { generateMenuReport } from './menuItemreport';
import { generateDateReport } from './report';

async function main() {
    await generateDateReport('2025-03-13');
    await generateMenuReport('2025-03-13');
}

main()