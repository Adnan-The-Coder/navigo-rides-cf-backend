import { Hono } from 'hono';
import { 
  createVehicle, 
  deleteVehicle, 
  getVehicles, 
  getVehicleById, 
  updateVehicle 
} from '../controllers/vehicle';

const vehicleRoutes = new Hono();

vehicleRoutes.post('/create', createVehicle);
vehicleRoutes.get('/get-all', getVehicles);
vehicleRoutes.patch('/update/:id', updateVehicle);
vehicleRoutes.get('/get/:id', getVehicleById);
vehicleRoutes.delete('/delete/:id/:deleteType', deleteVehicle);

export default vehicleRoutes;