import gql from "graphql-tag";

export const getShop = gql`
  query GetShop {
    shop {
      displayGrossPrices
      defaultCountry {
        code
        country
      }
      countries {
        country
        code
      }
      availableShippingMethods(channel: "default-channel") {
        id
        name
        maximumOrderPrice {
          amount
        }
        minimumOrderPrice {
          amount
        }
      }
    }
  }
`;
