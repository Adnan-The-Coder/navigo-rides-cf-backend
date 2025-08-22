import { Hono } from 'hono';
import { createDriver } from '../controllers/driver';
const driverRoutes = new Hono();

driverRoutes.post('/create', createDriver);


export default driverRoutes;