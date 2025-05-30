import express from 'express'
import logger from './utils/logger'

const app = express();

app.listen(3000, ()=> {
    logger.info('server running on 3000');
})

