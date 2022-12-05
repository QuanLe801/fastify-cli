import { FastifyPluginAsync } from 'fastify';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

const uri =
  'mongodb+srv://quanlemanh:quanlemanh@testingmongo.i6nhehi.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri);

client.connect();
const db = client.db('list_item');
const collection = db.collection('item');
const tags = ['items'];

//Item schema
const Item = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    age: { type: 'integer' },
  },
};

//Options for get all items
const getItemsOpts = {
  schema: {
    summary: 'Returns a list of items.',
    tags: tags,
    response: {
      200: {
        type: 'array',
        items: Item,
      },
      404: {
        description: 'Response when resources empty!',
        properties: {
          error: {
            type: 'string',
          },
        },
      },
    },
  },
};

//Options for get single item
const getItemOpts = {
  schema: {
    summary: 'Returns an item.',
    tags: tags,
    params: {
      id: { type: 'integer' },
    },
    response: {
      200: Item,
      404: {
        description: 'Response when resources not found!',
        properties: {
          error: {
            type: 'string',
          },
        },
      },
    },
  },
};

//Options for post single item
const postItemOpts = {
  schema: {
    summary: 'post an item.',
    tags: tags,
    body: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
      },
    },
    response: {
      201: Item,
    },
  },
};

//Options for del single item
const delItemOpts = {
  schema: {
    summary: 'delete an item.',
    tags: tags,
    params: {
      id: { type: 'integer' },
    },
    response: {
      200: {
        ...Item,
        description: 'A JSON object contains metadata about deletion',
        properties: {
          deleted: {
            type: 'string',
          },
        },
      },

      404: {
        description: 'Response when id not found',
        properties: {
          error: {
            type: 'string',
          },
        },
      },
    },
    security: [
      {
        apiKey: [],
      },
    ],
  },
};

//Options for del many item
// const delManyItemsOpts = {
//   schema: {
//     summary: 'delete many items depend on name.',
//     tags: tags,
//     params: {
//       name: { type: 'string' },
//     },
//     response: {
//       200: {
//         ...Item,
//         description: 'A JSON object contains metadata about deletion',
//         properties: {
//           deleted: {
//             type: 'string',
//           },
//         },
//       },
//       404: {
//         description: 'Response when name not found',
//         properties: {
//           error: {
//             type: 'string',
//           },
//         },
//       },
//     },
//   },
// };

//Options for update single item
const updateItemOpts = {
  schema: {
    summary: 'update an item.',
    tags: tags,
    params: {
      id: { type: 'string' },
    },
    respone: {
      200: Item,
    },
  },
};

const example: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  //get all items
  fastify.get('/items', getItemsOpts, async (req, res) => {
    try {
      const findResult = await collection.find({}).toArray();
      res.status(200).send(findResult);
      console.log(findResult);
    } catch (err) {
      return res.status(404).send({ error: 'Data empty!' });
    }
  });

  //get single items
  fastify.get('/items/:id', getItemOpts, async (req, res) => {
    try {
      const findResult = await collection.findOne(req.params as any);
      if (!findResult) return res.status(404).send({ error: 'Id not found!' });
      return res.status(200).send(findResult);
    } catch (err) {
      res.status(404).send({ error: 'Error!' });
    }
  });

  //add item
  fastify.post('/items', postItemOpts, async (req, res) => {
    try {
      const { name, age } = req.body as any;
      const id = parseInt(uuidv4(), 16);
      const obj = { name, age, id };
      await collection.insertOne(obj);
      return res.status(201).send(obj);
    } catch (err) {
      res.status(404).send({ error: 'Error!' });
    }
  });

  //delete item
  fastify.delete('/items/:id', delItemOpts, async (req, res) => {
    const { id } = req.params as any;
    try {
      const result = await collection.findOne(req.params as any);
      if (!result) return res.status(404).send({ error: `Id not found!` });
      await collection.deleteOne(req.params as any);
      return res.status(200).send({ deleted: `Item ${id} has been removed` });
    } catch (err) {
      res.status(404).send({ error: `Id ${id} not found!` });
    }
  });

  //delete many item
  // fastify.delete('/items', delManyItemsOpts, async (req, res) => {
  //   // const { name } = req.body as any;
  //   console.log(req);
  //   try {
  //     const result = await collection.find(req.body as any);
  //     if (!result)
  //       return res.status(404).send({ error: `${req.body as any} not found!` });
  //     await collection.deleteMany(req.body as any);
  //     return res
  //       .code(200)
  //       .send({ deleted: `Items ${req.body} has been removed` });
  //   } catch (err) {
  //     res.status(404).send({ error: `${req.body as any} not found!` });
  //   }
  // });

  //update item
  fastify.put('/items/:id', updateItemOpts, async (req, res) => {
    const id = req.params;
    const result = await collection.updateOne(req.params as any, {
      $set: req.body,
    });
    res.code(200).send({ message: `item ${id}  has been updated` });
    console.log(result);
  });
};

export default example;
