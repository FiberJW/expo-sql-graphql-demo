import { ApolloClient } from "apollo-client";
import gql from "graphql-tag";
import { SQLite } from "expo";
import { InMemoryCache } from "apollo-cache-inmemory";

const db = SQLite.openDatabase("apollo_test.db");

let transactionAsync = (SQLString, args) => {
  return new Promise(function(resolve, reject) {
    db.transaction(transaction => {
      transaction.executeSql(
        SQLString,
        args,
        (tx, resultSet) => resolve(resultSet),
        reject
      );
    });
  });
};

transactionAsync(
  "create table if not exists people (id integer primary key not null, name text);",
  []
);

const typeDefs = gql`
  type Person {
    name: String!
    id: ID!
  }

  type Query {
    getPerson(id: ID!): Person
    getAllPeople: [Person]
  }

  type Mutation {
    addPerson(name: String!): Boolean
    clearRecords: Boolean
  }
`;

export const client = new ApolloClient({
  cache: new InMemoryCache(),
  resolvers: {
    Query: {
      async getPerson(_, { id }) {
        let peopleMatchingId = await transactionAsync(
          "select * from people where id = ?;",
          [id]
        );
        return { ...peopleMatchingId[0] };
      },
      async getAllPeople(_) {
        let allPeople = (await transactionAsync(
          "select id, name from people;"
        )).rows._array.map(p => ({ ...p, __typename: "Person" }));

        return allPeople;
      },
    },
    Mutation: {
      async addPerson(_, { name }) {
        await transactionAsync("insert into people (name) values (?)", [name]);
        return true;
      },
      async clearRecords(_) {
        await transactionAsync("DELETE FROM people");
        return true;
      },
    },
  },
  typeDefs,
});
