import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  TextInput,
} from "react-native";
import { client } from "./SQLiteClient";
import gql from "graphql-tag";
import { Query, ApolloProvider, Mutation } from "react-apollo";

const GET_ALL_PEOPLE = gql`
  query GetAllPeople($id: ID!) {
    getAllPeople @client {
      name
    }
  }
`;

const GET_PERSON = gql`
  query GetPerson($id: ID!) {
    getPerson(id: $id) @client {
      name
    }
  }
`;

const ADD_PERSON = gql`
  mutation AddPerson($name: String!) {
    addPerson(name: $name) @client
  }
`;

const CLEAR_RECORDS = gql`
  mutation ClearRecords {
    clearRecords @client
  }
`;

let Button = ({ onPress, label }) => (
  <TouchableOpacity
    style={{
      backgroundColor: "rgba(0,0,0,0.3)",
      color: "white",
      padding: 4,
      borderRadius: 2,
      marginBottom: 8,
    }}
    onPress={onPress}
  >
    <View accessible>
      <Text>{label}</Text>
    </View>
  </TouchableOpacity>
);

export default class App extends React.Component {
  state = { name: "", allPeople: [] };

  fetchRecords = async () => {
    const { data } = await client.query({
      query: GET_ALL_PEOPLE,
      variables: {},
      fetchPolicy: "no-cache",
    });

    let allPeople = [];
    if (data.getAllPeople) {
      allPeople = data.getAllPeople;
    }

    this.setState({ allPeople: allPeople });
  };

  componentDidMount() {
    this.fetchRecords();
  }

  render() {
    return (
      <ApolloProvider client={client}>
        <KeyboardAvoidingView behavior="padding" style={styles.container}>
          <Mutation
            mutation={CLEAR_RECORDS}
            onCompleted={() => {
              this.setState({ allPeople: [] });
            }}
          >
            {clearRecords => (
              <Mutation
                mutation={ADD_PERSON}
                onCompleted={() => {
                  this.setState({ name: "" });
                  this.fetchRecords();
                }}
              >
                {addPerson => (
                  <View>
                    <TextInput
                      blurOnSubmit
                      onSubmitEditing={() => {
                        if (this.state.name.trim().length === 0) {
                          alert("Must provide name in text input.");
                          return;
                        }
                        addPerson({ variables: { name: this.state.name } });
                      }}
                      keyboardAppearance="dark"
                      style={{
                        padding: 8,
                        borderBottomWidth: 1,
                        marginVertical: 16,
                        backgroundColor: "rgba(0,0,0,0.7)",
                        color: "white",
                        padding: 12,
                        borderRadius: 8,
                      }}
                      placeholderTextColor="rgba(255,255,255,0.45)"
                      placeholder="name"
                      onChangeText={name => this.setState({ name })}
                      value={this.state.name}
                      underlineColorAndroid="rgba(0,0,0,0.2)"
                    />
                    <Button
                      onPress={() => {
                        if (this.state.name.trim().length === 0) {
                          alert("Must provide name in text input.");
                          return;
                        }
                        addPerson({ variables: { name: this.state.name } });
                      }}
                      label="Add Person To Database"
                    />
                    <Button
                      onPress={this.fetchRecords}
                      label="Fetch People From Database"
                    />
                    <Button
                      onPress={async () => {
                        clearRecords();
                      }}
                      label="Clear Database"
                    />
                    {this.state.allPeople.length ? (
                      <View style={{ marginBottom: 2 }}>
                        <Text style={{ fontWeight: "bold", marginVertical: 8 }}>
                          Saved People Records:
                        </Text>
                        {this.state.allPeople.map((p, i) => (
                          <Text key={i}>Name: {p.name}</Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                )}
              </Mutation>
            )}
          </Mutation>
        </KeyboardAvoidingView>
      </ApolloProvider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
