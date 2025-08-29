import { Hono } from 'hono';
import { createDriver, getAllDrivers, updateDriver } from '../controllers/driver';
const driverRoutes = new Hono();

driverRoutes.post('/create', createDriver);
driverRoutes.get('/get-all',getAllDrivers);
driverRoutes.patch('/update/:uuid',updateDriver);


export default driverRoutes;