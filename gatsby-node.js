const { createRemoteFileNode } = require(`gatsby-source-filesystem`);

exports.createResolvers = ({
  actions: { createNode },
  cache,
  createNodeId,
  createResolvers,
  store,
  reporter,
}, {
  imageFieldName,
  imageFieldType,
  schemaName
}) => {
  const state = store.getState();
  const schema = state.schemaCustomization.thirdPartySchemas.filter(s => s._typeMap[schemaName])[0];

  if (!schema){
    throw new Error(`SCHEMA '${schemaName} NOT FOUND'`)
  } else{
    const filters = [imageFieldName ? `name '${imageFieldName}'`: null, imageFieldType ? `type '${imageFieldType}'`: null].filter(x => x).join(' or ');
    console.log(`Found schema '${schemaName}', traversing for fields with ${filters}`);
  }

  const reSchema = new RegExp(`${schemaName}_`);
  const reNotNull = new RegExp(`!$`);
  function shouldCreateNode(field, typeEntry) {
    if ((typeof imageFieldName === `string`) && (field.name === imageFieldName) || (imageFieldName instanceof RegExp) && imageFieldName.test(field.name)) {
      const typeEntryStr = String(typeEntry);
      console.log(`Found a matching field ${field.name} in type ${typeEntryStr}`);
      if ((typeof imageFieldType === `string`) && (typeEntryStr === imageFieldType) || (imageFieldType instanceof RegExp) && imageFieldType.test(typeEntryStr)) {
        console.log(`Both type and field name matches!! Adding ${field.name}Sharp`);
        return true;
      }
    }
    return false;
  }

  const typeMap = schema._typeMap;
  const resolvers = {};

  for (const typeName in typeMap) {
    const typeEntry = typeMap[typeName];
    const typeFields = (typeEntry && typeEntry.getFields && typeEntry.getFields()) || {};
    
    const typeResolver = {};
    for (const fieldName in typeFields) {
      const field = typeFields[fieldName];

      if (shouldCreateNode(field, typeEntry)){
        
        
        typeResolver[`${fieldName}Sharp`] = {
          type: 'File',
          resolve(source) {
            const url = source[fieldName];
            if (url) {
              return createRemoteFileNode({
                url,
                store,
                cache,
                createNode,
                createNodeId,
                reporter,
              });
            }
            return null;
          },
        };
      }
    }
    if (Object.keys(typeResolver).length) {
      resolvers[typeName] = typeResolver;
    }
  }

  if (Object.keys(resolvers).length) {
    createResolvers(resolvers);
  }
}

