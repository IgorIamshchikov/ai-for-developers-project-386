# frozen_string_literal: true

require "rails_helper"

RSpec.shared_examples "ошибка валидации бронирования" do
  it "возвращает 422" do
    expect(response).to have_http_status(:unprocessable_content)
  end

  it "соответствует контракту" do
    assert_response_conforms
  end

  it "возвращает код ошибки validation" do
    expect(response.parsed_body["error"]["code"]).to eq("validation")
  end
end

RSpec.describe "Api::Bookings", type: :request do
  let(:event_type) { EventType.create!(title: "Знакомство", description: "Короткий звонок", duration_minutes: 30) }

  around { |example| travel_to(Time.utc(2026, 1, 1, 10, 0)) { example.run } }

  def book(overrides = {})
    post "/api/bookings", as: :json, params: {
      eventTypeId: event_type.id,
      startsAt: "2026-01-01T10:30:00Z",
      visitorName: "Алекс",
      visitorEmail: "alex@example.com"
    }.merge(overrides)
  end

  describe "POST /api/bookings" do
    describe "когда данные валидны" do
      before { book }

      it "возвращает 201" do
        expect(response).to have_http_status(:created)
      end

      it "соответствует контракту" do
        assert_api_conform(status: 201)
      end

      it "возвращает созданный ресурс" do
        expect(response.parsed_body).to include(
          "eventTypeId" => event_type.id, "startsAt" => "2026-01-01T10:30:00Z",
          "visitorName" => "Алекс", "visitorEmail" => "alex@example.com"
        )
      end

      it "генерирует id в виде uuid" do
        expect(response.parsed_body["id"]).to match(/\A[0-9a-f-]{36}\z/)
      end
    end

    describe "когда eventTypeId неизвестен" do
      before { book(eventTypeId: SecureRandom.uuid) }

      it "возвращает 404" do
        expect(response).to have_http_status(:not_found)
      end

      it "соответствует контракту" do
        assert_api_conform(status: 404)
      end

      it "возвращает код ошибки not_found" do
        expect(response.parsed_body["error"]["code"]).to eq("not_found")
      end
    end

    describe "гонка двух бронирований на пересекающийся интервал" do
      before do
        book
        book
      end

      it "второй запрос возвращает 409" do
        expect(response).to have_http_status(:conflict)
      end

      it "соответствует контракту" do
        assert_response_conforms
      end

      it "возвращает код ошибки slot_taken" do
        expect(response.parsed_body["error"]["code"]).to eq("slot_taken")
      end
    end

    describe "когда visitorName пустой" do
      before { book(visitorName: "") }

      it_behaves_like "ошибка валидации бронирования"
    end

    describe "когда visitorEmail некорректен" do
      before { book(visitorEmail: "not-an-email") }

      it_behaves_like "ошибка валидации бронирования"
    end

    describe "когда startsAt не на границе сетки" do
      before { book(startsAt: "2026-01-01T10:15:00Z") }

      it_behaves_like "ошибка валидации бронирования"
    end

    describe "когда startsAt в прошлом" do
      before { book(startsAt: "2026-01-01T09:30:00Z") }

      it_behaves_like "ошибка валидации бронирования"
    end

    describe "когда startsAt вне 14-дневного окна" do
      before { book(startsAt: "2026-01-15T00:00:00Z") }

      it_behaves_like "ошибка валидации бронирования"
    end
  end

  describe "GET /api/bookings" do
    before do
      event_type.bookings.create!(starts_at: Time.utc(2026, 1, 2, 10, 0), visitor_name: "Б", visitor_email: "b@example.com")
      event_type.bookings.create!(starts_at: Time.utc(2026, 1, 1, 10, 30), visitor_name: "А", visitor_email: "a@example.com")

      get "/api/bookings"
    end

    it "возвращает 200" do
      expect(response).to have_http_status(:ok)
    end

    it "соответствует контракту" do
      assert_api_conform(status: 200)
    end

    it "возвращает бронирования по возрастанию startsAt" do
      expect(response.parsed_body.pluck("visitorName")).to eq(%w[А Б])
    end
  end

  describe "GET /api/bookings когда бронирование уже началось" do
    before do
      event_type.bookings.create!(starts_at: Time.utc(2026, 1, 1, 10, 30), visitor_name: "А", visitor_email: "a@example.com")

      travel_to(Time.utc(2026, 1, 1, 11, 0))
      get "/api/bookings"
    end

    it "возвращает 200" do
      expect(response).to have_http_status(:ok)
    end

    it "соответствует контракту" do
      assert_api_conform(status: 200)
    end

    it "не включает прошедшее бронирование" do
      expect(response.parsed_body).to be_empty
    end
  end
end
