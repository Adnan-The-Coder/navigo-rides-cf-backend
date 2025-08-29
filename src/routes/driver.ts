import { Hono } from 'hono';
import { createDriver, deleteDriver, getAllDrivers, getDriverByUUID, updateDriver } from '../controllers/driver';
const driverRoutes = new Hono();

driverRoutes.post('/create', createDriver);
driverRoutes.get('/get-all',getAllDrivers);
driverRoutes.patch('/update/:uuid',updateDriver);
driverRoutes.get('/get/:uuid',getDriverByUUID);
driverRoutes.delete('/delete/:uuid/:mode', deleteDriver);


export default driverRoutes;